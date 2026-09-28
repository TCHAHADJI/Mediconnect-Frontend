import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Search, Pill, Check, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

interface MasterMedicine {
  _id: string;
  name: string;
  genericName?: string;
  brand?: string;
  strength?: string;
  dosage?: string;
  form?: string;
  category?: string;
  dispensingCategory?: string;
  atcCode?: string;
  manufacturer?: string;
  referencePriceCeiling?: number;
}

interface AddFromCatalogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddFromCatalogueModal({ isOpen, onClose, onSuccess }: AddFromCatalogueModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MasterMedicine[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MasterMedicine | null>(null);

  // Store-specific inventory fields
  const [quantity, setQuantity] = useState('50');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [batchNumber, setBatchNumber] = useState(`LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split('T')[0];
  });
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [locationInStore, setLocationInStore] = useState('Rayon A');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-search when query changes
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/master-catalogue/search?q=${encodeURIComponent(searchQuery)}&limit=10`
        );
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.data || []);
        }
      } catch (err) {
        console.error('Master search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  const handleSelectMedicine = (med: MasterMedicine) => {
    setSelectedMedicine(med);
    if (med.referencePriceCeiling && !price) {
      setPrice(med.referencePriceCeiling.toString());
    }
  };

  const getAuthToken = () => {
    const session = localStorage.getItem('userSession');
    if (session) {
      return JSON.parse(session).token;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicine) {
      toast.error('Please select a medicine from the Master Catalogue first.');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast.error('Please enter a valid selling price in FCFA.');
      return;
    }
    if (!batchNumber.trim()) {
      toast.error('Batch / Lot number is mandatory for safety & recall tracking.');
      return;
    }

    setIsSubmitting(true);
    const token = getAuthToken();

    try {
      const payload = {
        medicineId: selectedMedicine._id,
        quantity: parseInt(quantity, 10),
        price: parseFloat(price),
        costPrice: costPrice ? parseFloat(costPrice) : undefined,
        batchNumber: batchNumber.trim(),
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        lowStockThreshold: parseInt(lowStockThreshold, 10),
        locationInStore: locationInStore.trim() || undefined
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Failed to add medicine to inventory');
      }

      toast.success(`${selectedMedicine.name} added to your stock successfully!`);
      setSelectedMedicine(null);
      setSearchQuery('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Add inventory error:', err);
      toast.error(err.message || 'Error adding to inventory.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:max-w-2xl">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Add to Stock from Master Catalogue
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select certified WHO/MINSANTÉ medications without creating redundant or duplicate records.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step 1: Search & Pick from Master Catalogue */}
        {!selectedMedicine ? (
          <div className="space-y-4 pt-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Type drug name, DCI / Generic, or ATC code (e.g. Paracétamol, Coartem)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl focus:bg-white dark:focus:bg-slate-800 transition-colors"
                autoFocus
              />
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40">
              {isSearching ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>Searching Master Catalogue...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No registered medicines found. Try typing another generic name or brand.
                </div>
              ) : (
                searchResults.map((med) => (
                  <div
                    key={med._id}
                    onClick={() => handleSelectMedicine(med)}
                    className="p-3.5 hover:bg-emerald-50/90 dark:hover:bg-slate-800/90 cursor-pointer flex items-center justify-between transition-colors bg-white dark:bg-slate-900"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                        {med.name}
                        {med.atcCode && (
                          <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                            {med.atcCode}
                          </span>
                        )}
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">DCI:</span> {med.genericName} •{' '}
                        {med.strength || med.dosage} • {med.form || 'Comprimé'}
                      </div>
                      {med.manufacturer && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-400">Lab: {med.manufacturer}</div>
                      )}
                    </div>

                    <div className="text-right">
                      {med.referencePriceCeiling ? (
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Plafond: {med.referencePriceCeiling.toLocaleString()} FCFA
                        </div>
                      ) : null}
                      <Button size="sm" variant="ghost" className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60 h-7 mt-1 font-medium">
                        Select →
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Step 2: Configure Store-specific Stock Values */
          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            {/* Selected master drug preview card */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-start justify-between shadow-sm">
              <div className="space-y-1">
                <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Selected Master Item
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  {selectedMedicine.name}
                  <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-white/80 dark:bg-emerald-900/40">
                    {selectedMedicine.atcCode || 'WHO'}
                  </Badge>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  DCI: {selectedMedicine.genericName} • {selectedMedicine.strength} • {selectedMedicine.form}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedMedicine(null)}
                className="text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm"
              >
                Change Drug
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="stock-qty" className="text-slate-700 dark:text-slate-300 font-medium text-xs">Stock Quantity (Units) *</Label>
                <Input
                  id="stock-qty"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stock-price" className="text-slate-700 dark:text-slate-300 font-medium text-xs">Selling Retail Price (FCFA) *</Label>
                <Input
                  id="stock-price"
                  type="number"
                  min="0"
                  placeholder="e.g. 1500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stock-batch" className="text-slate-700 dark:text-slate-300 font-medium text-xs">Batch / Lot Number * (for Recall Safety)</Label>
                <Input
                  id="stock-batch"
                  placeholder="e.g. LOT-2026-X04"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  required
                  className="font-mono bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stock-expiry" className="text-slate-700 dark:text-slate-300 font-medium text-xs">Expiration Date *</Label>
                <Input
                  id="stock-expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stock-low" className="text-slate-700 dark:text-slate-300 font-medium text-xs">Low-Stock Alert Level</Label>
                <Input
                  id="stock-low"
                  type="number"
                  min="1"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stock-loc" className="text-slate-700 dark:text-slate-300 font-medium text-xs">Physical Shelf Location</Label>
                <Input
                  id="stock-loc"
                  placeholder="e.g. Rayon B-04, Frigo"
                  value={locationInStore}
                  onChange={(e) => setLocationInStore(e.target.value)}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSelectedMedicine(null)} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                {isSubmitting ? 'Saving to Stock...' : 'Add to Pharmacy Stock'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
