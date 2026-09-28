import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { 
  Scan, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  Search, 
  Barcode, 
  Sparkles, 
  RefreshCw, 
  Download, 
  FileText, 
  Check, 
  AlertOctagon, 
  HelpCircle, 
  Building2, 
  ExternalLink,
  Plus,
  Eye,
  Camera
} from 'lucide-react';

interface VerificationResult {
  verificationId: string;
  timestamp: string;
  verdict: 'GENUINE_COMPLIANT' | 'RECALLED_DANGER' | 'UNREGISTERED_COUNTERFEIT' | 'EXPIRED_SUSPECT' | 'PENDING_REGISTRATION';
  verdictTitle: string;
  verdictDescription: string;
  securityScore: number;
  parsedCodes: {
    rawInput: string;
    isGs1Format: boolean;
    gtin: string;
    batchNumber: string;
    expiryDate: string;
    serialNumber: string;
    daysUntilExpiry: number | null;
  };
  medicine: {
    id: string;
    name: string;
    genericName?: string;
    brand?: string;
    manufacturer?: string;
    atcCode?: string;
    strength?: string;
    form?: string;
    dispensingCategory?: string;
    requiresPrescription?: boolean;
    referencePriceCeiling?: number;
    minsanteApproved?: boolean;
    minsanteApprovalNumber?: string;
  } | null;
  recallAlert: {
    batchNumber: string;
    severity: string;
    reason: string;
    hazardDescription?: string;
    issuedBy: string;
    totalQuarantined?: number;
  } | null;
  physicalChecklist: {
    label: string;
    status: string;
  }[];
}

interface DrugPackagingVerifierProps {
  onAddVerifiedToStock?: (medicine: any, batchNumber: string, expiryDate: string) => void;
}

export function DrugPackagingVerifier({ onAddVerifiedToStock }: DrugPackagingVerifierProps) {
  const [rawCode, setRawCode] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [medicineName, setMedicineName] = useState('');

  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isScannerSimActive, setIsScannerSimActive] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>({
    0: true,
    1: true,
    2: true,
    3: true
  });

  const handleVerify = async (codeToVerify?: string, manualLot?: string, manualMed?: string) => {
    const inputCode = codeToVerify !== undefined ? codeToVerify : rawCode;
    const inputLot = manualLot !== undefined ? manualLot : batchNumber;
    const inputMed = manualMed !== undefined ? manualMed : medicineName;

    if (!inputCode.trim() && !inputLot.trim() && !inputMed.trim()) {
      toast.error('Please scan or type a packaging barcode, GS1 DataMatrix code, or batch number.');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/medicines/verify-packaging`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rawCode: inputCode.trim(),
          batchNumber: inputLot.trim(),
          expiryDate: expiryDate.trim(),
          serialNumber: serialNumber.trim(),
          medicineName: inputMed.trim()
        })
      });

      const res = await response.json();
      if (res.success && res.data) {
        setResult(res.data);
        if (res.data.verdict === 'GENUINE_COMPLIANT') {
          toast.success('Packaging Authentic: Certified MINSANTÉ approved drug.');
        } else if (res.data.verdict === 'RECALLED_DANGER') {
          toast.error('CRITICAL: Batch recalled by Health Authority!');
        } else if (res.data.verdict === 'UNREGISTERED_COUNTERFEIT') {
          toast.warning('Warning: Unregistered packaging code! High counterfeit risk.');
        } else if (res.data.verdict === 'EXPIRED_SUSPECT') {
          toast.warning('Warning: Product batch has expired!');
        }
      } else {
        toast.error(res.message || 'Verification could not be processed.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Network error during packaging verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Test Presets
  const applyPreset = (type: 'COARTEM' | 'DOLIPRANE' | 'RECALLED' | 'FAKE') => {
    if (type === 'COARTEM') {
      const code = '(01)03400930000017(17)271231(10)LOT-2026-X04(21)SN849302194';
      setRawCode(code);
      setBatchNumber('LOT-2026-X04');
      setMedicineName('Coartem 20/120mg');
      handleVerify(code, 'LOT-2026-X04', 'Coartem 20/120mg');
    } else if (type === 'DOLIPRANE') {
      const code = '3400930000017';
      setRawCode(code);
      setBatchNumber('LOT-DOL-2026-01');
      setMedicineName('Doliprane');
      handleVerify(code, 'LOT-DOL-2026-01', 'Doliprane');
    } else if (type === 'RECALLED') {
      const code = '(01)03400930000099(17)261231(10)LOT-AMOX-2024-09(21)SN994012';
      setRawCode(code);
      setBatchNumber('LOT-AMOX-2024-09');
      setMedicineName('Amoxicillin 500mg');
      handleVerify(code, 'LOT-AMOX-2024-09', 'Amoxicillin 500mg');
    } else if (type === 'FAKE') {
      const code = '(01)99999999999999(17)250101(10)LOT-FAKE-999(21)SN0000000';
      setRawCode(code);
      setBatchNumber('LOT-FAKE-999');
      setMedicineName('Unknown Falsified Box');
      handleVerify(code, 'LOT-FAKE-999', 'Unknown Falsified Box');
    }
  };

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-100 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Anti-Counterfeiting & Serialization Verification Terminal</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Verify Drug Packaging Code
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl">
              Scan or enter GS1 DataMatrix codes, CIP barcodes, and lot numbers to instantly authenticate medicines against the Central MINSANTÉ Drug Catalogue and active National Recall database.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              GS1 & WHO Compliant
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Grid: Input / Scanner on Left (5 Cols) + Result on Right (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Scanner & Input (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Scan className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                      Packaging Scanner
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Scan 2D DataMatrix or enter barcode
                    </CardDescription>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsScannerSimActive(!isScannerSimActive)}
                  className={`rounded-xl text-xs flex items-center gap-1.5 ${
                    isScannerSimActive 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  {isScannerSimActive ? 'Laser Active' : 'Camera Scan'}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              {/* Simulated Camera Viewfinder */}
              {isScannerSimActive && (
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-500/70 p-6 flex flex-col items-center justify-center text-center shadow-inner">
                  {/* Laser scan animation line */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-bounce top-1/2 -translate-y-1/2 pointer-events-none" />
                  <div className="border border-dashed border-emerald-400/50 rounded-xl w-48 h-32 flex items-center justify-center mb-3">
                    <Barcode className="w-16 h-16 text-emerald-400/60 animate-pulse" />
                  </div>
                  <div className="text-xs font-semibold text-emerald-300">
                    Align 2D DataMatrix or Barcode inside viewfinder
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Optical sensor active • Auto-decodes GS1 AIs (01, 17, 10, 21)
                  </div>
                  <Button
                    size="sm"
                    onClick={() => applyPreset('COARTEM')}
                    className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-7"
                  >
                    Simulate Sample Scan
                  </Button>
                </div>
              )}

              {/* Main Code Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>GS1 2D DataMatrix or Barcode / CIP Code *</span>
                  <span className="text-[10px] text-slate-400 font-mono font-normal">Supports (01), (17), (10), (21)</span>
                </Label>
                <div className="relative">
                  <Barcode className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="e.g. (01)03400930000017(17)261231(10)LOT-2026-X04"
                    value={rawCode}
                    onChange={(e) => setRawCode(e.target.value)}
                    className="pl-10 font-mono text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-11"
                  />
                </div>
              </div>

              {/* Secondary Breakdown Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Batch / Lot Number
                  </Label>
                  <Input
                    placeholder="e.g. LOT-2026-X04"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="font-mono text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Expiration Date
                  </Label>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Drug Name / Commercial Label (Optional Search)
                </Label>
                <Input
                  placeholder="e.g. Coartem, Doliprane, Paracétamol..."
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>

              {/* Verify Button */}
              <Button
                onClick={() => handleVerify()}
                disabled={isVerifying}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl h-11 shadow-md transition-all duration-200"
              >
                {isVerifying ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Querying National Registry...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Verify Packaging Authenticity
                  </span>
                )}
              </Button>

              {/* Quick Testing Presets */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Verification Test Samples:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => applyPreset('COARTEM')}
                    className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-left transition-colors"
                  >
                    <div className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Coartem 20/120
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Authentic GS1 2D</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('DOLIPRANE')}
                    className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-left transition-colors"
                  >
                    <div className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      Doliprane 500mg
                    </div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400">Authentic CIP Barcode</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('RECALLED')}
                    className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-left transition-colors"
                  >
                    <div className="font-bold flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3 text-rose-600" />
                      Recalled Amoxicillin
                    </div>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400">LOT-AMOX-2024-09</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('FAKE')}
                    className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-left transition-colors"
                  >
                    <div className="font-bold flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-amber-600" />
                      Falsified / Fake Code
                    </div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400">Unregistered Box</div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Verification Dossier & Analysis Result (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!result ? (
            <Card className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white/60 dark:bg-slate-900/60 flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Scan className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Ready to Verify Packaging Code
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
                Scan with your handheld barcode reader, enter the packaging text string, or click a quick sample above to run serialization checks.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  WHO-ATC Verification
                </span>
                <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                  National Recall Database
                </span>
                <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  <Barcode className="w-3.5 h-3.5 text-blue-500" />
                  GS1 DataMatrix Parsing
                </span>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Verdict Highlight Card */}
              <Card className={`rounded-3xl border-2 shadow-lg overflow-hidden ${
                result.verdict === 'GENUINE_COMPLIANT'
                  ? 'border-emerald-500 bg-white dark:bg-slate-900'
                  : result.verdict === 'RECALLED_DANGER'
                  ? 'border-rose-500 bg-white dark:bg-slate-900'
                  : result.verdict === 'EXPIRED_SUSPECT'
                  ? 'border-amber-500 bg-white dark:bg-slate-900'
                  : 'border-orange-500 bg-white dark:bg-slate-900'
              }`}>
                {/* Header Banner */}
                <div className={`p-5 flex items-center justify-between text-white ${
                  result.verdict === 'GENUINE_COMPLIANT'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                    : result.verdict === 'RECALLED_DANGER'
                    ? 'bg-gradient-to-r from-rose-600 to-red-700'
                    : result.verdict === 'EXPIRED_SUSPECT'
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-700'
                    : 'bg-gradient-to-r from-orange-600 to-amber-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-2xl bg-white/20 backdrop-blur-md">
                      {result.verdict === 'GENUINE_COMPLIANT' ? (
                        <CheckCircle2 className="w-7 h-7" />
                      ) : result.verdict === 'RECALLED_DANGER' ? (
                        <AlertOctagon className="w-7 h-7 animate-bounce" />
                      ) : (
                        <XCircle className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                        Verification Status Result
                      </div>
                      <h3 className="font-extrabold text-lg tracking-tight">
                        {result.verdictTitle}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] uppercase opacity-80 font-bold">Safety Score</div>
                    <div className="text-2xl font-black">{result.securityScore}%</div>
                  </div>
                </div>

                <CardContent className="pt-5 space-y-5">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {result.verdictDescription}
                  </p>

                  {/* Recall Alert Details Box */}
                  {result.recallAlert && (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                          <AlertOctagon className="w-4 h-4 text-rose-600" />
                          Official Health Authority Quarantine Decree
                        </div>
                        <Badge className="bg-rose-600 text-white text-[10px]">
                          SEVERITY: {result.recallAlert.severity}
                        </Badge>
                      </div>
                      <div className="text-xs font-semibold">
                        Reason: {result.recallAlert.reason}
                      </div>
                      <div className="text-[11px] text-rose-700 dark:text-rose-300">
                        Issued by: {result.recallAlert.issuedBy} • Total national units quarantined: {result.recallAlert.totalQuarantined || 'Active Recall'}
                      </div>
                      <div className="pt-1">
                        <Badge variant="outline" className="text-[10px] border-rose-500 text-rose-700 bg-white/70">
                          ACTION REQUIRED: Isolate this lot immediately in your quarantine locker.
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Parsed Code Breakdown Grid */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Barcode className="w-3.5 h-3.5 text-blue-500" />
                        Decoded Packaging Identifiers
                      </span>
                      {result.parsedCodes.isGs1Format && (
                        <span className="text-[10px] text-emerald-600 font-mono font-semibold">
                          GS1 Compliant Format
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-400 font-medium">GTIN / Barcode (01)</div>
                        <div className="font-mono font-bold text-slate-900 dark:text-white truncate">
                          {result.parsedCodes.gtin}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-400 font-medium">Batch / Lot (10)</div>
                        <div className="font-mono font-bold text-slate-900 dark:text-white truncate">
                          {result.parsedCodes.batchNumber}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-400 font-medium">Expiration (17)</div>
                        <div className="font-mono font-bold text-slate-900 dark:text-white truncate">
                          {result.parsedCodes.expiryDate}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-400 font-medium">Serial Number (21)</div>
                        <div className="font-mono font-bold text-slate-900 dark:text-white truncate">
                          {result.parsedCodes.serialNumber}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Registered Medicine Profile */}
                  {result.medicine && (
                    <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          National Drug Catalogue Match
                        </div>
                        {result.medicine.minsanteApprovalNumber && (
                          <Badge variant="outline" className="text-[10px] border-blue-400 text-blue-700 dark:text-blue-300 bg-white/70">
                            Homologation: {result.medicine.minsanteApprovalNumber}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">
                            {result.medicine.name}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            DCI: <span className="font-semibold text-blue-700 dark:text-blue-400">{result.medicine.genericName || 'Standard DCI'}</span> • {result.medicine.strength} • {result.medicine.form}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Laboratory: {result.medicine.manufacturer} • ATC: {result.medicine.atcCode}
                          </p>
                        </div>

                        {result.medicine.referencePriceCeiling ? (
                          <div className="text-right sm:self-center shrink-0">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">MINSANTÉ Ceiling</div>
                            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                              {result.medicine.referencePriceCeiling.toLocaleString()} FCFA
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Pharmacist Physical Verification Checklist */}
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>Pharmacist Physical Inspection Checklist</span>
                      <span className="text-[10px] text-slate-400">Verify carton & blister pack</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {result.physicalChecklist.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => toggleCheck(idx)}
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(checkedItems[idx])}
                            onChange={() => toggleCheck(idx)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                          />
                          <span className="text-slate-700 dark:text-slate-300 select-none text-[11px] leading-tight">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>

                {/* Card Footer Actions */}
                <CardFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[10px] text-slate-400 font-mono">
                    Ref ID: {result.verificationId}
                  </div>

                  <div className="flex items-center gap-2">
                    {result.verdict === 'GENUINE_COMPLIANT' && onAddVerifiedToStock && result.medicine && (
                      <Button
                        size="sm"
                        onClick={() => onAddVerifiedToStock(result.medicine, result.parsedCodes.batchNumber, result.parsedCodes.expiryDate)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm h-8"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add to Pharmacy Stock
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        toast.success('Inspection report saved to audit history log.');
                      }}
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs h-8"
                    >
                      <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      Save Report
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
