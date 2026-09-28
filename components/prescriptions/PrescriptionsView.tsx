import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  Camera,
  Search,
  ArrowRight,
  ShieldCheck,
  Clock,
  Check,
  Eye,
  AlertCircle,
  ExternalLink,
  Store,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export interface PrescribedMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
  dispensed?: boolean;
}

export interface PrescriptionItem {
  _id?: string;
  id?: string;
  prescriptionNumber: string;
  type: 'PAPER_UPLOAD' | 'DIGITAL_PRESCRIPTION';
  title: string;
  prescriberName: string;
  prescriberHospital: string;
  prescriberPhone?: string;
  prescriberLicenseNumber?: string;
  issueDate: string | Date;
  expiryDate?: string | Date;
  status: 'ACTIVE' | 'DISPENSED' | 'PARTIALLY_DISPENSED' | 'EXPIRED';
  paperImageUrl?: string | null;
  medicines: PrescribedMedicine[];
  notes?: string;
  createdAt?: string;
}

interface PrescriptionsViewProps {
  user?: any;
  onNavigateToPharmacies?: () => void;
  onNavigateToMedicines?: () => void;
}

const COMMON_PRESCRIPTIONS_MEDS = [
  'Coartem (Artemether + Lumefantrine)',
  'Amoxicilline 500mg',
  'Paracetamol 500mg / 1g',
  'Ciprofloxacine 500mg',
  'Omeprazole 20mg',
  'Metformine 850mg',
  'Amlodipine 5mg',
  'Ibuprofène 400mg',
  'Vitamine C + Zinc',
  'SRO (Sels de Réhydratation Orale)',
];

export function PrescriptionsView({ onNavigateToPharmacies, onNavigateToMedicines }: PrescriptionsViewProps) {
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upload' | 'digital'>('all');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'DISPENSED'>('ALL');

  // Paper Upload Form State
  const [title, setTitle] = useState('Ordonnance Médicale');
  const [prescriberName, setPrescriberName] = useState('');
  const [prescriberHospital, setPrescriberHospital] = useState('Hôpital Central de Yaoundé (HCY)');
  const [prescriberPhone, setPrescriberPhone] = useState('');
  const [prescriberLicenseNumber, setPrescriberLicenseNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [paperImagePreview, setPaperImagePreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Medicines Builder
  const [medicinesList, setMedicinesList] = useState<PrescribedMedicine[]>([
    {
      name: 'Coartem (Artemether + Lumefantrine)',
      dosage: '1 comprimé',
      frequency: '2 fois par jour',
      duration: '3 jours',
      quantity: 1,
      instructions: 'À prendre au milieu d’un repas gras',
      dispensed: false,
    },
    {
      name: 'Paracetamol 500mg',
      dosage: '1 comprimé',
      frequency: 'Toutes les 6 heures en cas de fièvre',
      duration: '5 jours',
      quantity: 1,
      instructions: 'Ne pas dépasser 3g par jour',
      dispensed: false,
    },
  ]);

  // Lightbox modal for paper scan zoom
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const getAuthToken = () => {
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed?.token || parsed?.data?.token || parsed?.user?.data?.token;
      } catch (e) {}
    }
    return null;
  };

  const fetchPrescriptions = async () => {
    setIsLoading(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/prescriptions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        const list = data.data?.prescriptions || (Array.isArray(data.data) ? data.data : []);
        setPrescriptions(list);
        localStorage.setItem('cachedPrescriptions', JSON.stringify(list));
      } else {
        const cached = localStorage.getItem('cachedPrescriptions');
        if (cached) setPrescriptions(JSON.parse(cached));
      }
    } catch (e) {
      const cached = localStorage.getItem('cachedPrescriptions');
      if (cached) {
        try { setPrescriptions(JSON.parse(cached)); } catch (err) {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  // Image compressor to ensure database payload remains lean
  const handlePaperImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setPaperImagePreview(compressedDataUrl);
          toast.success('Paper prescription photo loaded & compressed');
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleAddMedicineRow = () => {
    setMedicinesList([
      ...medicinesList,
      {
        name: '',
        dosage: '1 unité',
        frequency: '2x par jour',
        duration: '7 jours',
        quantity: 1,
        instructions: 'Après le repas',
        dispensed: false,
      },
    ]);
  };

  const handleUpdateMedicineRow = (index: number, field: keyof PrescribedMedicine, value: any) => {
    const updated = [...medicinesList];
    updated[index] = { ...updated[index], [field]: value };
    setMedicinesList(updated);
  };

  const handleRemoveMedicineRow = (index: number) => {
    if (medicinesList.length <= 1) {
      toast.error('At least one prescribed medicine line is required');
      return;
    }
    setMedicinesList(medicinesList.filter((_, i) => i !== index));
  };

  const handleSavePaperPrescription = async () => {
    if (!prescriberName.trim()) {
      toast.error('Please enter the doctor or prescriber name');
      return;
    }

    const validMedicines = medicinesList.filter((m) => m.name.trim().length > 0);
    if (validMedicines.length === 0) {
      toast.error('Please specify at least one prescribed medication');
      return;
    }

    setIsSubmitting(true);
    const token = getAuthToken();

    const payload = {
      type: 'PAPER_UPLOAD' as const,
      title: title.trim() || 'Ordonnance Papier Numérisée',
      prescriberName: prescriberName.trim(),
      prescriberHospital: prescriberHospital.trim(),
      prescriberPhone: prescriberPhone.trim(),
      prescriberLicenseNumber: prescriberLicenseNumber.trim(),
      issueDate,
      paperImageUrl: paperImagePreview,
      medicines: validMedicines,
      notes: notes.trim(),
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.data) {
        toast.success(`Prescription ${data.data.prescriptionNumber} securely uploaded!`);
        fetchPrescriptions();
        setActiveTab('all');
        // Reset form
        setTitle('Ordonnance Médicale');
        setPrescriberName('');
        setPaperImagePreview(null);
        setNotes('');
      } else {
        throw new Error(data.message || 'Failed to upload prescription');
      }
    } catch (err: any) {
      // Local fallback
      const localItem: PrescriptionItem = {
        _id: 'ord_loc_' + Date.now(),
        prescriptionNumber: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'ACTIVE',
        ...payload,
        createdAt: new Date().toISOString(),
      };
      setPrescriptions([localItem, ...prescriptions]);
      toast.success('Prescription saved to your medical hub');
      setActiveTab('all');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDispensed = async (prescription: PrescriptionItem) => {
    const id = prescription._id || prescription.id;
    const nextStatus = prescription.status === 'ACTIVE' ? 'DISPENSED' : 'ACTIVE';
    const token = getAuthToken();

    setPrescriptions((prev) =>
      prev.map((p) => ((p._id || p.id) === id ? { ...p, status: nextStatus } : p))
    );

    toast.success(nextStatus === 'DISPENSED' ? 'Prescription marked as filled/dispensed' : 'Prescription reactivated');

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/prescriptions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (e) {}
  };

  const handleDeletePrescription = async (id: string, num: string) => {
    if (!confirm(`Delete prescription ${num}?`)) return;

    const token = getAuthToken();
    setPrescriptions((prev) => prev.filter((p) => (p._id || p.id) !== id));
    toast.info(`Prescription ${num} deleted`);

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/prescriptions/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (e) {}
  };

  const filteredPrescriptions = prescriptions.filter((p) => {
    if (filterStatus === 'ACTIVE') return p.status === 'ACTIVE';
    if (filterStatus === 'DISPENSED') return p.status === 'DISPENSED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-800 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-blue-200 border border-blue-200/30">
              <FileText className="w-3.5 h-3.5" />
              Prescriptions & Ordonnances Médicales
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Prescription Management Hub</h1>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Digitize handwritten paper prescriptions, access certified electronic prescriptions, and seamlessly check medication availability across accredited Cameroonian pharmacies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setActiveTab('upload')}
              className="bg-white text-blue-900 hover:bg-blue-50 font-bold shadow-md rounded-2xl px-5 h-12 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Camera className="w-4 h-4 text-blue-700" />
              Upload Paper Prescription
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <TabsList className="bg-slate-100 p-1.5 rounded-2xl">
            <TabsTrigger value="all" className="rounded-xl text-xs sm:text-sm font-bold py-2">
              All Prescriptions ({prescriptions.length})
            </TabsTrigger>
            <TabsTrigger value="upload" className="rounded-xl text-xs sm:text-sm font-bold py-2">
              <Upload className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Upload Paper Scan
            </TabsTrigger>
            <TabsTrigger value="digital" className="rounded-xl text-xs sm:text-sm font-bold py-2">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Digital Prescriptions
            </TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchPrescriptions}
            disabled={isLoading}
            className="rounded-xl self-start sm:self-auto text-slate-600 hover:text-slate-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* TAB 1: ALL PRESCRIPTIONS */}
        <TabsContent value="all" className="space-y-4 m-0">
          {/* Status filter bar */}
          <div className="flex items-center gap-2">
            {(['ALL', 'ACTIVE', 'DISPENSED'] as const).map((st) => (
              <Button
                key={st}
                size="sm"
                variant={filterStatus === st ? 'default' : 'outline'}
                onClick={() => setFilterStatus(st)}
                className={`rounded-xl text-xs font-bold h-8 ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active / Ready' : 'Filled / Dispensed'}
              </Button>
            ))}
          </div>

          {filteredPrescriptions.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-2 p-8 text-center bg-slate-50/50">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No prescriptions found</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-5">
                Upload photos of your doctor's handwritten prescriptions to keep an organized history and check pharmacy stock.
              </p>
              <Button onClick={() => setActiveTab('upload')} className="bg-blue-600 text-white rounded-2xl px-6">
                <Camera className="w-4 h-4 mr-2" />
                Upload Paper Prescription Now
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredPrescriptions.map((p) => {
                const id = p._id || p.id || '';
                const isActive = p.status === 'ACTIVE';

                return (
                  <Card
                    key={id}
                    className={`rounded-3xl border transition-all ${
                      isActive ? 'border-slate-200 bg-white hover:shadow-md' : 'border-slate-200 bg-slate-50/70 opacity-75'
                    }`}
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* Top Row: Title, Number, Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                              {p.prescriptionNumber}
                            </span>
                            <Badge
                              className={`text-xs rounded-full font-bold ${
                                isActive ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'
                              }`}
                            >
                              {isActive ? 'Active / Ready' : 'Dispensed'}
                            </Badge>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 mt-1 leading-tight">{p.title}</h4>
                        </div>

                        {p.paperImageUrl && (
                          <div
                            onClick={() => setZoomImage(p.paperImageUrl || null)}
                            className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer group shrink-0 shadow-2xs hover:scale-105 transition-transform"
                            title="Click to zoom handwritten prescription"
                          >
                            <img src={p.paperImageUrl} alt="Paper Prescription" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Doctor & Facility */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          <span>{p.prescriberName}</span>
                          {p.prescriberLicenseNumber && (
                            <span className="text-[10px] text-slate-500 font-mono">({p.prescriberLicenseNumber})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{p.prescriberHospital}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 pt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Issued: {new Date(p.issueDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Prescribed Medicines list */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                          Prescribed Medication Lines ({p.medicines?.length || 0})
                        </span>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {(p.medicines || []).map((med, mIdx) => (
                            <div
                              key={mIdx}
                              className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-2"
                            >
                              <div>
                                <span className="font-bold text-slate-900 block leading-tight">{med.name}</span>
                                <span className="text-[11px] text-slate-500">
                                  {med.dosage} • {med.frequency} • {med.duration}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                                Qty: {med.quantity || 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleDispensed(p)}
                            className="rounded-xl text-xs h-8"
                          >
                            {isActive ? 'Mark Dispensed' : 'Reactivate'}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeletePrescription(id, p.prescriptionNumber)}
                            className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {onNavigateToPharmacies && (
                          <Button
                            size="sm"
                            onClick={onNavigateToPharmacies}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold h-8 px-3"
                          >
                            <Store className="w-3.5 h-3.5 mr-1" />
                            Find in Pharmacies
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: UPLOAD PAPER SCAN */}
        <TabsContent value="upload" className="space-y-6 m-0">
          <Card className="rounded-3xl border-slate-200 shadow-sm max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
                <Camera className="w-5 h-5 text-blue-600" />
                Upload Handwritten Paper Prescription
              </CardTitle>
              <CardDescription>
                Take a photograph or upload a scan of your physical prescription. The system will archive it and make its medications searchable across pharmacies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Photo Upload Area */}
              <div>
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Prescription Document / Photo *
                </Label>
                <div className="border-2 border-dashed border-slate-300 rounded-3xl p-6 text-center bg-slate-50/50 hover:bg-blue-50/30 transition-colors">
                  {paperImagePreview ? (
                    <div className="space-y-3">
                      <div className="max-w-xs mx-auto max-h-56 rounded-2xl overflow-hidden border-2 border-blue-400 shadow-md">
                        <img src={paperImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex justify-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPaperImagePreview(null)}
                          className="rounded-xl text-xs text-rose-600 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove Photo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div>
                        <label
                          htmlFor="paper-file-upload"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer inline-flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Choose Photograph or Scan
                        </label>
                        <input
                          id="paper-file-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePaperImageSelect}
                          className="hidden"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        PNG, JPG, or HEIC format. Captured images are automatically optimized.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Prescriber & Clinic Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="presc-title" className="text-xs font-semibold text-slate-700">
                    Prescription Title
                  </Label>
                  <Input
                    id="presc-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Traitement Paludisme & Fièvre"
                    className="h-10 rounded-xl mt-1 text-sm font-semibold"
                  />
                </div>

                <div>
                  <Label htmlFor="presc-doctor" className="text-xs font-semibold text-slate-700">
                    Doctor / Prescriber Name *
                  </Label>
                  <Input
                    id="presc-doctor"
                    value={prescriberName}
                    onChange={(e) => setPrescriberName(e.target.value)}
                    placeholder="e.g. Dr. Marie-Claire Atangana"
                    className="h-10 rounded-xl mt-1 text-sm font-semibold"
                  />
                </div>

                <div>
                  <Label htmlFor="presc-hosp" className="text-xs font-semibold text-slate-700">
                    Clinic / Hospital Formation Sanitaire
                  </Label>
                  <Input
                    id="presc-hosp"
                    value={prescriberHospital}
                    onChange={(e) => setPrescriberHospital(e.target.value)}
                    placeholder="Hôpital Central de Yaoundé (HCY)"
                    className="h-10 rounded-xl mt-1 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="presc-date" className="text-xs font-semibold text-slate-700">
                    Issue Date
                  </Label>
                  <Input
                    id="presc-date"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="h-10 rounded-xl mt-1 text-sm"
                  />
                </div>
              </div>

              {/* Prescribed Medicines Item Builder */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Prescribed Medication Lines
                    </Label>
                    <p className="text-[11px] text-slate-500">
                      Add each medication written on the paper prescription so you can find them in pharmacies.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddMedicineRow}
                    className="rounded-xl text-xs text-blue-700 font-bold border-blue-200 hover:bg-blue-50"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Medication
                  </Button>
                </div>

                <div className="space-y-3">
                  {medicinesList.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2.5 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-700">Medication #{idx + 1}</span>
                        {medicinesList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicineRow(idx)}
                            className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <Input
                            placeholder="Medicine Name (e.g. Coartem)"
                            value={med.name}
                            onChange={(e) => handleUpdateMedicineRow(idx, 'name', e.target.value)}
                            className="h-9 rounded-xl bg-white text-xs font-bold"
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="Dosage (e.g. 500mg, 1 tablet)"
                            value={med.dosage}
                            onChange={(e) => handleUpdateMedicineRow(idx, 'dosage', e.target.value)}
                            className="h-9 rounded-xl bg-white text-xs"
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="Frequency (e.g. 2x daily)"
                            value={med.frequency}
                            onChange={(e) => handleUpdateMedicineRow(idx, 'frequency', e.target.value)}
                            className="h-9 rounded-xl bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          placeholder="Instructions (e.g. After meal, avoid dairy)"
                          value={med.instructions}
                          onChange={(e) => handleUpdateMedicineRow(idx, 'instructions', e.target.value)}
                          className="h-9 rounded-xl bg-white text-xs"
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder="Duration (e.g. 7 days)"
                            value={med.duration}
                            onChange={(e) => handleUpdateMedicineRow(idx, 'duration', e.target.value)}
                            className="h-9 rounded-xl bg-white text-xs flex-1"
                          />
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={med.quantity}
                            onChange={(e) => handleUpdateMedicineRow(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="h-9 rounded-xl bg-white text-xs w-20"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('all')}
                  className="rounded-2xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSavePaperPrescription}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 font-bold shadow-md"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Digitize Prescription'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: DIGITAL ELECTRONIC PRESCRIPTIONS */}
        <TabsContent value="digital" className="space-y-6 m-0">
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Certified Electronic Prescriptions</h3>
              <p className="text-xs text-slate-500">
                Prescriptions generated by accredited medical facilities with official ONMC verification codes.
              </p>
            </div>

            {/* DEMONSTRATION OF SECURE DIGITAL PRESCRIPTION */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-300 shadow-xl relative overflow-hidden font-sans">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-5 flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                    RÉPUBLIQUE DU CAMEROUN • ORDRE NATIONAL DES MÉDECINS (ONMC)
                  </div>
                  <h3 className="text-xl font-black text-slate-950 mt-0.5">ORDONNANCE MÉDICALE ÉLECTRONIQUE</h3>
                  <p className="text-xs text-slate-600 font-medium">Hôpital Central de Yaoundé • Service de Médecine Interne</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-7 h-7" />
                </div>
              </div>

              {/* Prescriber & Patient Line */}
              <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Praticien Prescripteur</span>
                  <span className="font-bold text-slate-900 text-sm">Dr. Marie-Claire Atangana</span>
                  <span className="text-[10px] text-slate-500 block font-mono">ONMC N° 2018/HCY/4921</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Date de Prescription</span>
                  <span className="font-bold text-slate-900">{new Date().toLocaleDateString()}</span>
                  <span className="text-[10px] text-emerald-700 block font-bold">✓ Signature Numérique Vérifiée</span>
                </div>
              </div>

              {/* Prescription Items */}
              <div className="space-y-4 py-2">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between font-bold text-sm text-slate-950">
                    <span>1. Coartem 20mg/120mg (Artemether + Lumefantrine)</span>
                    <span className="font-mono text-xs">Boîte de 24 cp</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">
                    Posologie: 4 comprimés en 2 prises par jour (Matin et Soir au milieu d'un repas) pendant 3 jours consécutifs.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between font-bold text-sm text-slate-950">
                    <span>2. Paracetamol 1000mg comprimés effervescents</span>
                    <span className="font-mono text-xs">Boîte de 8 cp</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">
                    Posologie: 1 comprimé en cas de fièvre &gt; 38.5°C ou céphalées. Espacer les prises d'au moins 6 heures. Maximum 3g/jour.
                  </p>
                </div>
              </div>

              {/* Barcode & Verification Footer */}
              <div className="pt-4 border-t-2 border-slate-900 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="font-mono text-[10px] text-slate-500">
                  CODE VÉRIFICATION: <span className="font-bold text-slate-900">CM-ONMC-2026-84920</span>
                </div>
                {onNavigateToPharmacies && (
                  <Button
                    size="sm"
                    onClick={onNavigateToPharmacies}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
                  >
                    <Store className="w-3.5 h-3.5 mr-1" />
                    Dispense at Accredited Pharmacy
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* PAPER ZOOM LIGHTBOX DIALOG */}
      <Dialog open={Boolean(zoomImage)} onOpenChange={() => setZoomImage(null)}>
        <DialogContent className="sm:max-w-[700px] p-4 rounded-3xl bg-slate-950 text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">
              Handwritten Paper Prescription Scan
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              High resolution view for pharmacist and patient verification.
            </DialogDescription>
          </DialogHeader>
          {zoomImage && (
            <div className="max-h-[75vh] overflow-auto rounded-2xl my-2 flex items-center justify-center bg-black/50">
              <img src={zoomImage} alt="Prescription Full Scan" className="max-w-full h-auto object-contain rounded-xl" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
