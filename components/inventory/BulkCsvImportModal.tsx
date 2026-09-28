import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Download, ArrowRight, RefreshCw } from 'lucide-react';

interface BulkCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow {
  name: string;
  quantity: number;
  price: number;
  batchNumber: string;
  expiryDate: string;
}

export function BulkCsvImportModal({ isOpen, onClose, onSuccess }: BulkCsvImportModalProps) {
  const [csvContent, setCsvContent] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importReport, setImportReport] = useState<any>(null);

  const getAuthToken = () => {
    const session = localStorage.getItem('userSession');
    if (session) {
      return JSON.parse(session).token;
    }
    return null;
  };

  const sampleCsv = `name,quantity,price,batchNumber,expiryDate
Coartem 20/120mg,100,2800,LOT-2026-A1,2027-12-31
Doliprane 500mg,250,1200,LOT-2026-B4,2028-06-30
Amoxicilline 500mg Gélule,80,2400,LOT-2026-C9,2027-04-15
Sels de Réhydratation Orale (SRO) OMS,300,300,LOT-2026-D2,2028-01-01
Flagyl 500mg (Métronidazole),60,1800,LOT-2026-E7,2027-09-30`;

  const handleLoadSample = () => {
    setCsvContent(sampleCsv);
    parseCsv(sampleCsv);
  };

  const parseCsv = (text: string) => {
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase());
    const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('nom') || h.includes('medicament') || h.includes('designation'));
    const qtyIdx = headers.findIndex(h => h.includes('qty') || h.includes('quantite') || h.includes('stock'));
    const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('prix') || h.includes('tarif'));
    const batchIdx = headers.findIndex(h => h.includes('batch') || h.includes('lot'));
    const expIdx = headers.findIndex(h => h.includes('exp') || h.includes('peremption') || h.includes('date'));

    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/[,;\t]/).map(p => p.trim());
      if (parts.length === 0) continue;

      const name = nameIdx !== -1 ? parts[nameIdx] : parts[0];
      const quantity = qtyIdx !== -1 ? parseInt(parts[qtyIdx] || '0', 10) : parseInt(parts[1] || '0', 10);
      const price = priceIdx !== -1 ? parseFloat(parts[priceIdx] || '0') : parseFloat(parts[2] || '0');
      const batchNumber = batchIdx !== -1 ? parts[batchIdx] : (parts[3] || `LOT-${Date.now().toString().slice(-4)}`);
      const expiryDate = expIdx !== -1 ? parts[expIdx] : (parts[4] || '2027-12-31');

      if (name) {
        rows.push({
          name,
          quantity: isNaN(quantity) ? 0 : quantity,
          price: isNaN(price) ? 0 : price,
          batchNumber,
          expiryDate
        });
      }
    }

    setParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      parseCsv(content);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) {
      toast.error('No valid rows found to import.');
      return;
    }

    setIsProcessing(true);
    const token = getAuthToken();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/inventory-sync/import-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: parsedRows })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Bulk import failed');
      }

      setImportReport(data.report);
      toast.success(`Bulk sync complete! ${data.report.successfullyImported} added, ${data.report.updatedExisting} updated.`);
      onSuccess();
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error(err.message || 'Error processing bulk import.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
            <FileSpreadsheet className="h-5 w-5" />
            Connect Existing Stock — Smart Bulk CSV / Excel Import
          </DialogTitle>
          <DialogDescription>
            Import stock exports from WinPharma, SmartPharm, or Excel. Items are automatically matched to the Central Master Catalogue.
          </DialogDescription>
        </DialogHeader>

        {!importReport ? (
          <div className="space-y-4 pt-2">
            {/* Action Bar */}
            <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" className="gap-2 pointer-events-none">
                    <Upload className="h-4 w-4" />
                    Upload CSV File
                  </Button>
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
                <Button type="button" variant="ghost" size="sm" onClick={handleLoadSample} className="text-xs text-indigo-600">
                  Load Cameroon Sample Template
                </Button>
              </div>

              <Badge variant="secondary" className="font-mono text-xs">
                {parsedRows.length} lines detected
              </Badge>
            </div>

            {/* Manual Text Paste Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Or Paste CSV / Tab-separated data directly below:
              </label>
              <textarea
                rows={4}
                placeholder="name,quantity,price,batchNumber,expiryDate"
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  parseCsv(e.target.value);
                }}
                className="w-full font-mono text-xs p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Live Parsing Preview */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Preview ({parsedRows.length} items to match against Master Catalogue):
                </div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-semibold border-b">
                      <tr>
                        <th className="p-2">Medicine Name</th>
                        <th className="p-2">Stock</th>
                        <th className="p-2">Price (FCFA)</th>
                        <th className="p-2">Lot / Batch</th>
                        <th className="p-2">Expiry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedRows.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-2 font-medium">{row.name}</td>
                          <td className="p-2 font-mono">{row.quantity}</td>
                          <td className="p-2 font-mono">{row.price.toLocaleString()}</td>
                          <td className="p-2 font-mono">{row.batchNumber}</td>
                          <td className="p-2 font-mono">{row.expiryDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 10 && (
                    <div className="p-2 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 border-t">
                      + {parsedRows.length - 10} more rows
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="pt-3 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={parsedRows.length === 0 || isProcessing}
                onClick={handleConfirmImport}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Matching & Importing...
                  </>
                ) : (
                  <>
                    Match & Import to Stock
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Report View */
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <div className="font-bold text-slate-900 dark:text-white text-lg">Import Processed Successfully</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                {importReport.successfullyImported} new medicines added, {importReport.updatedExisting} existing stock records updated.
              </div>
            </div>

            {importReport.unmatchedItems?.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs space-y-1">
                <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  {importReport.unmatchedItems.length} Unmatched Items (Not in Master Catalogue):
                </div>
                <div className="max-h-28 overflow-y-auto pl-5 list-disc text-amber-700 dark:text-amber-400">
                  {importReport.unmatchedItems.map((item: any, i: number) => (
                    <div key={i}>• {item.name}</div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => { setImportReport(null); onClose(); }}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
