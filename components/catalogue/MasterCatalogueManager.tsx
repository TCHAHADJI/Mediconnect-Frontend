import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { 
  Search, Plus, ShieldCheck, AlertTriangle, Pill, 
  Sparkles, RefreshCw, CheckCircle2, FileText, Database, Layers,
  Trash2, Edit3, Filter, ArrowUpDown
} from 'lucide-react';

interface MasterMedicine {
  _id: string;
  name: string;
  genericName?: string;
  brand?: string;
  manufacturer?: string;
  atcCode?: string;
  activeIngredient?: string;
  strength?: string;
  dosage?: string;
  form?: string;
  administrationRoute?: string;
  category?: string;
  dispensingCategory?: 'OTC' | 'PRESCRIPTION_ONLY' | 'CONTROLLED_SUBSTANCE';
  requiresPrescription?: boolean;
  isControlledSubstance?: boolean;
  minsanteApproved?: boolean;
  minsanteApprovalNumber?: string;
  bioequivalentGroup?: string;
  referencePriceCeiling?: number;
  barcode?: string;
  description?: string;
  isActive?: boolean;
}

export function MasterCatalogueManager() {
  const [medicines, setMedicines] = useState<MasterMedicine[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDispensing, setFilterDispensing] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageSize, setPageSize] = useState('50');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalInDb: 0,
    activeCount: 0,
    filteredCount: 0
  });

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<MasterMedicine | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    brand: '',
    manufacturer: '',
    atcCode: '',
    activeIngredient: '',
    strength: '',
    form: 'Comprimé',
    administrationRoute: 'Oral',
    category: 'Général',
    dispensingCategory: 'OTC',
    requiresPrescription: false,
    isControlledSubstance: false,
    minsanteApproved: true,
    minsanteApprovalNumber: '',
    referencePriceCeiling: '',
    barcode: '',
    description: ''
  });

  const getAuthToken = () => {
    // 1. Check admin auth from localStorage (mediconnect_admin_auth)
    const adminSession = localStorage.getItem('mediconnect_admin_auth');
    if (adminSession) {
      try {
        const parsed = JSON.parse(adminSession);
        if (parsed?.token && parsed.token !== 'null' && parsed.token !== 'undefined') {
          return parsed.token;
        }
      } catch (e) {
        console.error('Error parsing admin auth session', e);
      }
    }

    // 2. Check user session from localStorage (userSession)
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed?.token && parsed.token !== 'null' && parsed.token !== 'undefined') {
          return parsed.token;
        }
      } catch (e) {
        console.error('Error parsing user session', e);
      }
    }

    // 3. Check direct token keys in localStorage & sessionStorage
    const directKeys = ['auth_token', 'token', 'admin_token'];
    for (const key of directKeys) {
      const val = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (val && val !== 'null' && val !== 'undefined') {
        return val;
      }
    }

    // 4. Check sessionStorage for session objects
    const sessionAdmin = sessionStorage.getItem('mediconnect_admin_auth');
    if (sessionAdmin) {
      try {
        const parsed = JSON.parse(sessionAdmin);
        if (parsed?.token && parsed.token !== 'null' && parsed.token !== 'undefined') {
          return parsed.token;
        }
      } catch (e) {}
    }

    const sessionUser = sessionStorage.getItem('userSession');
    if (sessionUser) {
      try {
        const parsed = JSON.parse(sessionUser);
        if (parsed?.token && parsed.token !== 'null' && parsed.token !== 'undefined') {
          return parsed.token;
        }
      } catch (e) {}
    }

    return null;
  };

  const fetchMedicines = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize,
        search: search.trim(),
        category: filterCategory,
        dispensingCategory: filterDispensing,
        status: statusFilter
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/master-catalogue?${queryParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        setMedicines(data.data.medicines || []);
        setTotalPages(data.data.pagination?.pages || 1);
        setTotalCount(data.data.pagination?.total || 0);
        if (data.data.categories && Array.isArray(data.data.categories)) {
          setAvailableCategories(data.data.categories);
        }
        if (data.data.summary) {
          setSummaryStats(data.data.summary);
        }
      } else {
        toast.error(data.message || 'Failed to load master catalogue');
      }
    } catch (err: any) {
      console.error('Error fetching master catalogue:', err);
      toast.error('Network error loading master catalogue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedicines();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterCategory, filterDispensing, statusFilter, pageSize, page]);

  const handleOpenCreate = () => {
    setEditingMedicine(null);
    setFormData({
      name: '',
      genericName: '',
      brand: '',
      manufacturer: '',
      atcCode: '',
      activeIngredient: '',
      strength: '',
      form: 'Comprimé',
      administrationRoute: 'Oral',
      category: 'Général',
      dispensingCategory: 'OTC',
      requiresPrescription: false,
      isControlledSubstance: false,
      minsanteApproved: true,
      minsanteApprovalNumber: '',
      referencePriceCeiling: '',
      barcode: '',
      description: ''
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (med: MasterMedicine) => {
    setEditingMedicine(med);
    setFormData({
      name: med.name || '',
      genericName: med.genericName || '',
      brand: med.brand || '',
      manufacturer: med.manufacturer || '',
      atcCode: med.atcCode || '',
      activeIngredient: med.activeIngredient || '',
      strength: med.strength || med.dosage || '',
      form: med.form || 'Comprimé',
      administrationRoute: med.administrationRoute || 'Oral',
      category: med.category || 'Général',
      dispensingCategory: med.dispensingCategory || (med.requiresPrescription ? 'PRESCRIPTION_ONLY' : 'OTC'),
      requiresPrescription: !!med.requiresPrescription,
      isControlledSubstance: !!med.isControlledSubstance,
      minsanteApproved: med.minsanteApproved !== false,
      minsanteApprovalNumber: med.minsanteApprovalNumber || '',
      referencePriceCeiling: med.referencePriceCeiling ? med.referencePriceCeiling.toString() : '',
      barcode: med.barcode || '',
      description: med.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDeleteMedicine = async (med: MasterMedicine) => {
    if (!window.confirm(`Are you sure you want to remove/deactivate "${med.name}" from the active master catalogue?`)) {
      return;
    }
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication session not found or expired.');
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/master-catalogue/${med._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Failed to remove medicine');
      }
      toast.success(resData.message || 'Medicine deactivated successfully');
      fetchMedicines();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Error removing medicine.');
    }
  };

  const handleSaveMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Medicine name is required.');
      return;
    }

    setIsSaving(true);
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication session not found or expired. Please log in again.');
      setIsSaving(false);
      return;
    }

    try {
      const url = editingMedicine 
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/master-catalogue/${editingMedicine._id}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/master-catalogue`;

      const method = editingMedicine ? 'PUT' : 'POST';

      const payload: any = {
        ...formData,
        name: formData.name.trim(),
        genericName: formData.genericName.trim() || formData.name.trim(),
        brand: formData.brand.trim() || formData.name.trim(),
        manufacturer: formData.manufacturer.trim() || undefined,
        activeIngredient: formData.activeIngredient.trim() || undefined,
        strength: formData.strength.trim() || undefined,
        dosage: formData.strength.trim() || undefined,
        atcCode: formData.atcCode.trim() ? formData.atcCode.trim().toUpperCase() : undefined,
        barcode: formData.barcode.trim() ? formData.barcode.trim() : undefined,
        minsanteApprovalNumber: formData.minsanteApprovalNumber.trim() ? formData.minsanteApprovalNumber.trim() : undefined,
        referencePriceCeiling: formData.referencePriceCeiling ? parseFloat(formData.referencePriceCeiling) : undefined
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Operation failed');
      }

      toast.success(editingMedicine ? 'Master medicine updated!' : 'Certified medicine added to catalogue!');
      setIsDialogOpen(false);
      fetchMedicines();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Error saving master medicine.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedEssentialMedicines = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication session not found or expired. Please log in again.');
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/master-catalogue/seed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || 'Cameroon essential medicines seeded!');
        fetchMedicines();
      } else {
        toast.info(data.message);
      }
    } catch (err) {
      toast.error('Failed to trigger database seed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card with national authority context */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-emerald-400 border-emerald-400 bg-emerald-950/50 text-xs uppercase tracking-wider font-semibold">
                WHO-ATC & MINSANTÉ Standards
              </Badge>
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-none text-xs">
                {summaryStats.totalInDb || totalCount} Standardized Entries in Database
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Database className="h-6 w-6 text-emerald-400" />
              Central Master Medicine Catalogue (DCI / ATC)
            </h1>
            <p className="text-emerald-100/70 text-sm max-w-2xl">
              Official centralized repository for Cameroon. All medicines registered in MediConnect are standardized here with WHO-ATC codes, bioequivalence groups, and legal dispensing regulations.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedEssentialMedicines}
              className="bg-emerald-950/60 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/80 hover:text-white text-xs gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Seed Essential Medicines
            </Button>
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20 text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Master Medicine
            </Button>
          </div>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Total in Database</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {summaryStats.totalInDb || totalCount}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Standardized medicines</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Active & Certified</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {summaryStats.activeCount || totalCount}
          </div>
          <div className="text-[11px] text-slate-500">Live for pharmacy dispensing</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Categories</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {availableCategories.length || 7}
          </div>
          <div className="text-[11px] text-slate-500">Therapeutic classes</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Showing in View</div>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            {medicines.length}
          </div>
          <div className="text-[11px] text-slate-500">Of {totalCount} matching query</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="relative md:col-span-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by Brand, DCI, WHO-ATC code, category, or ingredient..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 text-sm bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="md:col-span-3">
              <select
                aria-label="Filter by Therapeutic Category"
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Categories ({availableCategories.length})</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="Filter by Legal Dispensing Status"
                value={filterDispensing}
                onChange={(e) => {
                  setFilterDispensing(e.target.value);
                  setPage(1);
                }}
                className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Legal Statuses</option>
                <option value="OTC">Over-The-Counter (OTC)</option>
                <option value="PRESCRIPTION_ONLY">Prescription-Only (Rx)</option>
                <option value="CONTROLLED_SUBSTANCE">Controlled Substance</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="Items per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value);
                  setPage(1);
                }}
                className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="25">Show 25 / page</option>
                <option value="50">Show 50 (All in DB)</option>
                <option value="100">Show 100 / page</option>
                <option value="all">Show All Records</option>
              </select>
            </div>

            <div className="md:col-span-1 flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMedicines}
                disabled={isLoading}
                className="w-full h-9 text-xs border-slate-200 dark:border-slate-800"
                title="Refresh Catalogue"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-emerald-500' : 'text-slate-600'}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 text-xs">
              <tr>
                <th className="px-4 py-3.5">Medicine & DCI / INN</th>
                <th className="px-4 py-3.5">ATC Code</th>
                <th className="px-4 py-3.5">Strength & Form</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Legal Status</th>
                <th className="px-4 py-3.5">MINSANTÉ Cap</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    Loading Master Catalogue from Database...
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <Pill className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    No standardized medicines found matching filters.
                  </td>
                </tr>
              ) : (
                medicines.map((med) => (
                  <tr key={med._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {med.name}
                        {med.minsanteApproved && (
                          <ShieldCheck className="h-4 w-4 text-emerald-500 inline flex-shrink-0" title="MINSANTÉ / ONPC Homologué" />
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        DCI: {med.genericName || '—'}
                      </div>
                      {(med.manufacturer || med.brand) && (
                        <div className="text-[11px] text-slate-400">
                          {med.manufacturer ? `Lab: ${med.manufacturer}` : `Brand: ${med.brand}`}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs">
                      {med.atcCode ? (
                        <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded text-xs font-semibold">
                          {med.atcCode}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Pending ATC</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="font-medium">{med.strength || med.dosage || 'Standard'}</div>
                      <div className="text-slate-500 text-[11px]">
                        {med.form || 'Comprimé'} • {med.administrationRoute || 'Oral'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-xs">
                      <Badge variant="outline" className="font-normal text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50">
                        {med.category || 'Général'}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 text-xs">
                      {med.dispensingCategory === 'CONTROLLED_SUBSTANCE' ? (
                        <Badge variant="destructive" className="text-[10px] bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300">
                          Stupéfiant / Réglementé
                        </Badge>
                      ) : med.dispensingCategory === 'PRESCRIPTION_ONLY' || med.requiresPrescription ? (
                        <Badge className="text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300">
                          Ordonnance (Rx)
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300">
                          Vente Libre (OTC)
                        </Badge>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {med.referencePriceCeiling ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          {med.referencePriceCeiling.toLocaleString()} FCFA
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Non fixé</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(med)}
                          className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-800 h-8 px-2"
                          title="Edit Medicine"
                        >
                          <Edit3 className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMedicine(med)}
                          className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-slate-800 h-8 px-2"
                          title="Deactivate / Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 gap-2">
          <div>
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{medicines.length}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{totalCount}</span> entries (Page{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{page}</span> of {totalPages})
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs h-8"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs h-8"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal Dialog for Add / Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-emerald-500" />
              {editingMedicine ? 'Edit Master Medicine Record' : 'Register Certified Medicine to Master Catalogue'}
            </DialogTitle>
            <DialogDescription>
              Adheres to WHO-ATC international taxonomy and MINSANTÉ pharmaceutical standards.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMedicine} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="med-name">Brand / Trade Name *</Label>
                <Input
                  id="med-name"
                  placeholder="e.g. Coartem 20/120mg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="med-dci">DCI / INN (Generic Name) *</Label>
                <Input
                  id="med-dci"
                  placeholder="e.g. Artéméther + Luméfantrine"
                  value={formData.genericName}
                  onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="med-atc">WHO-ATC Classification Code</Label>
                <Input
                  id="med-atc"
                  placeholder="e.g. P01BF01, N02BE01"
                  value={formData.atcCode}
                  onChange={(e) => setFormData({ ...formData, atcCode: e.target.value.toUpperCase() })}
                  className="font-mono uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="med-lab">Manufacturer / Laboratory</Label>
                <Input
                  id="med-lab"
                  placeholder="e.g. Novartis, Sanofi, Cinpharm"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="med-strength">Exact Strength / Dosage</Label>
                <Input
                  id="med-strength"
                  placeholder="e.g. 500mg, 20/120mg, 100 UI/ml"
                  value={formData.strength}
                  onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="med-form">Galenic Form</Label>
                <select
                  id="med-form"
                  aria-label="Galenic Form"
                  value={formData.form}
                  onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                  className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200"
                >
                  <option value="Comprimé">Comprimé (Tablet)</option>
                  <option value="Gélule">Gélule (Capsule)</option>
                  <option value="Sirop">Sirop (Syrup)</option>
                  <option value="Suspension">Suspension Buvable</option>
                  <option value="Injectable">Injectable (Ampoule / Flacon)</option>
                  <option value="Pommade / Crème">Pommade / Crème</option>
                  <option value="Sachet Poudre">Sachet Poudre</option>
                  <option value="Collyre">Collyre (Eye drops)</option>
                  <option value="Suppositoire">Suppositoire</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="med-route">Route of Administration</Label>
                <select
                  id="med-route"
                  aria-label="Route of Administration"
                  value={formData.administrationRoute}
                  onChange={(e) => setFormData({ ...formData, administrationRoute: e.target.value })}
                  className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200"
                >
                  <option value="Oral">Voie Orale</option>
                  <option value="Intraveineuse">Intraveineuse (IV)</option>
                  <option value="Intramusculaire">Intramusculaire (IM)</option>
                  <option value="Sous-cutanée">Sous-cutanée (SC)</option>
                  <option value="Cutanée / Topique">Cutanée / Topique</option>
                  <option value="Ophtalmique">Ophtalmique</option>
                  <option value="Rectale">Rectale</option>
                  <option value="Inhalation">Inhalation</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="med-category">Therapeutic Class / Category</Label>
                <Input
                  id="med-category"
                  placeholder="e.g. Antipaludique, Antibiotique"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="med-legal">Legal Dispensing Classification</Label>
                <select
                  id="med-legal"
                  aria-label="Legal Dispensing Classification"
                  value={formData.dispensingCategory}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setFormData({
                      ...formData,
                      dispensingCategory: cat as any,
                      requiresPrescription: cat !== 'OTC',
                      isControlledSubstance: cat === 'CONTROLLED_SUBSTANCE'
                    });
                  }}
                  className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200"
                >
                  <option value="OTC">Over-The-Counter (Vente libre sans ordonnance)</option>
                  <option value="PRESCRIPTION_ONLY">Prescription-Only (Ordonnance médicale stricte)</option>
                  <option value="CONTROLLED_SUBSTANCE">Controlled Substance (Stupéfiant / Psychotrope surveillé)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="med-price-cap">MINSANTÉ Ceiling Price (FCFA)</Label>
                <Input
                  id="med-price-cap"
                  type="number"
                  placeholder="e.g. 2500"
                  value={formData.referencePriceCeiling}
                  onChange={(e) => setFormData({ ...formData, referencePriceCeiling: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="med-desc">Clinical Description & Indications</Label>
              <textarea
                id="med-desc"
                rows={2}
                placeholder="Indication thérapeutique principale, posologie usuelle..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.minsanteApproved}
                  onChange={(e) => setFormData({ ...formData, minsanteApproved: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Homologué MINSANTÉ / ONPC</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isControlledSubstance}
                  onChange={(e) => setFormData({ ...formData, isControlledSubstance: e.target.checked })}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Substance Sous Contrôle Renforcé</span>
              </label>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSaving ? 'Saving...' : editingMedicine ? 'Save Changes' : 'Register to Master Catalogue'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
