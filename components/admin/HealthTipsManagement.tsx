import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Search,
  RefreshCw
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Malaria & Bed Net Prevention',
  'Cholera Response & Clean Water',
  'Hygiene & Sanitation',
  'Maternal & Child Health',
  'Vaccination & EPI Immunization',
  'Rational Drug & Antibiotic Use',
  'Counterfeit & Street Medicine Hazards',
  'Chronic Diseases, Diabetes & Hypertension',
  'Nutrition & Healthy Diet',
  'First Aid & Emergency Procedures',
  'Mental Health & Stress Management',
  'Seasonal & Climate Health',
  'Pediatric Care & Infant Nutrition'
];

interface HealthTip {
  _id: string;
  title: string;
  category: string;
  author: string;
  views: number;
  createdAt: string;
  isPublished: boolean;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  submitterRole?: string;
  reviewerNotes?: string;
  targetAudience?: string;
  priority?: 'STANDARD' | 'URGENT' | 'SEASONAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  content: string;
}

export function HealthTipsManagement() {
  const [healthTips, setHealthTips] = useState<HealthTip[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedTip, setSelectedTip] = useState<HealthTip | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const [formData, setFormData] = useState<{
    title: string;
    category: string;
    author: string;
    targetAudience: string;
    priority: 'STANDARD' | 'URGENT' | 'SEASONAL';
    content: string;
  }>({
    title: '',
    category: DEFAULT_CATEGORIES[0],
    author: '',
    targetAudience: 'General Public',
    priority: 'STANDARD',
    content: ''
  });

  const [isLoading, setIsLoading] = useState(true);

  // Multi-tier authentication retrieval supporting Admin Auth Context, userSession, and direct tokens
  const getAuthToken = (): string | null => {
    // 1. Check mediconnect_admin_auth (Primary Admin storage)
    const adminAuth = localStorage.getItem('mediconnect_admin_auth');
    if (adminAuth) {
      try {
        const parsed = JSON.parse(adminAuth);
        if (parsed?.token) return parsed.token;
      } catch {}
    }

    // 2. Check userSession (Standard user session)
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed?.token) return parsed.token;
        if (parsed?.data?.token) return parsed.data.token;
        if (parsed?.user?.data?.token) return parsed.user.data.token;
      } catch {}
    }

    // 3. Check sessionStorage fallbacks
    const sessionAdmin = sessionStorage.getItem('mediconnect_admin_auth');
    if (sessionAdmin) {
      try {
        const parsed = JSON.parse(sessionAdmin);
        if (parsed?.token) return parsed.token;
      } catch {}
    }

    const sessionUser = sessionStorage.getItem('userSession');
    if (sessionUser) {
      try {
        const parsed = JSON.parse(sessionUser);
        if (parsed?.token) return parsed.token;
      } catch {}
    }

    // 4. Check direct token keys
    const directToken = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (directToken) return directToken;

    return null;
  };

  const fetchCategories = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/health-tips/categories`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        // Merge fetched categories with default categories to provide an exhaustive list
        const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...data.data]));
        setAvailableCategories(merged);
      }
    } catch {
      // Keep defaults
    }
  };

  const fetchHealthTips = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication required. Please log in again.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/health-tips`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load health tips from server.');
      const result = await response.json();
      if (result.success) {
        setHealthTips(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error while loading health tips');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchHealthTips();
  }, []);

  const handleAddTip = () => {
    setFormData({
      title: '',
      category: availableCategories[0] || DEFAULT_CATEGORIES[0],
      author: 'MediConnect Administration',
      targetAudience: 'General Public',
      priority: 'STANDARD',
      content: ''
    });
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setEditMode(true);
    setShowDialog(true);
    setSelectedTip(null);
  };

  const handleEditTip = (tip: HealthTip) => {
    const hasCategory = availableCategories.includes(tip.category);
    setFormData({
      title: tip.title,
      category: hasCategory ? tip.category : 'CUSTOM',
      author: tip.author || 'MediConnect Administration',
      targetAudience: tip.targetAudience || 'General Public',
      priority: (tip.priority as any) === 'URGENT' || (tip.priority as any) === 'HIGH' ? 'URGENT' : (tip.priority as any) === 'SEASONAL' ? 'SEASONAL' : 'STANDARD',
      content: tip.content
    });
    if (!hasCategory) {
      setIsCustomCategory(true);
      setCustomCategoryInput(tip.category);
    } else {
      setIsCustomCategory(false);
      setCustomCategoryInput('');
    }
    setSelectedTip(tip);
    setEditMode(true);
    setShowDialog(true);
  };

  const handleSaveTip = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication required. Please log in again.');
      return;
    }

    const finalCategory = isCustomCategory ? customCategoryInput.trim() : formData.category.trim();
    if (!finalCategory) {
      toast.error('Please select or specify a valid category.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      category: finalCategory,
      author: formData.author.trim() || 'MediConnect Administration',
      targetAudience: formData.targetAudience,
      priority: formData.priority,
      content: formData.content.trim()
    };

    const method = selectedTip ? 'PATCH' : 'POST';
    const url = selectedTip
      ? `${import.meta.env.VITE_API_URL}/health-tips/${selectedTip._id}`
      : `${import.meta.env.VITE_API_URL}/health-tips`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Failed to save health tip.');
      }

      toast.success(
        selectedTip 
          ? 'Health tip updated successfully!' 
          : 'Draft advisory saved! It has been submitted to the Health Authority (MINSANTÉ) for clearance.'
      );
      setShowDialog(false);
      fetchCategories();
      fetchHealthTips();
    } catch (err: any) {
      toast.error(err.message || 'Error saving health tip');
    }
  };

  const handleDeleteTip = async (tipId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;

    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication required. Please log in again.');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/health-tips/${tipId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete health tip.');

      toast.success('Health tip successfully deleted from database.');
      fetchHealthTips();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting health tip');
    }
  };

  // Filtered tips
  const filteredTips = healthTips.filter(tip => {
    const matchesStatus = filterStatus === 'ALL' || tip.status === filterStatus;
    const matchesSearch = 
      tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = healthTips.filter(t => t.status === 'PENDING_APPROVAL' || t.status === 'DRAFT').length;
  const approvedCount = healthTips.filter(t => t.status === 'APPROVED').length;
  const rejectedCount = healthTips.filter(t => t.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-primary-100 shadow-soft">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Public Health Tips & Prevention Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Draft public health tips for patients. All drafts created by the administration are automatically routed for <strong>official regulatory clearance by the Health Authority (MINSANTÉ/ONPC)</strong> before being visible to patients.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchHealthTips}
            className="rounded-2xl text-xs border-primary-200 hover:bg-primary-50 text-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
          <Button 
            onClick={handleAddTip} 
            className="gradient-bg-primary text-white hover-lift rounded-2xl text-xs font-semibold shadow-soft"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Health Tip (Draft)
          </Button>
        </div>
      </div>

      {/* Regulatory Workflow Notice */}
      <div className="flex items-start gap-3 bg-amber-50/80 border border-amber-200 p-4 rounded-2xl text-xs text-amber-950">
        <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">MINSANTÉ Regulatory Clearance Workflow:</span>
          <p className="text-amber-900 leading-relaxed">
            To guarantee clinical validity and medical accuracy, any health tip drafted or updated by the administration remains strictly invisible to patients until it is reviewed and approved by Health Authority inspectors in their clearance portal.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-primary-100 bg-white shadow-soft">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Tips in DB</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{healthTips.length}</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-primary-50 text-primary-600">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border border-amber-100 bg-white shadow-soft">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-800">Pending Authority Review</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-emerald-100 bg-white shadow-soft">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-800">Approved & Published</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{approvedCount}</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-rose-100 bg-white shadow-soft">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-rose-800">Rejected / Needs Revision</p>
                <p className="text-2xl font-black text-rose-600 mt-1">{rejectedCount}</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={filterStatus === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('ALL')}
              className={`rounded-2xl text-xs ${
                filterStatus === 'ALL' ? 'gradient-bg-primary text-white shadow-soft' : 'border-primary-200'
              }`}
            >
              All ({healthTips.length})
            </Button>
            <Button
              variant={filterStatus === 'PENDING_APPROVAL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('PENDING_APPROVAL')}
              className={`rounded-2xl text-xs ${
                filterStatus === 'PENDING_APPROVAL' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'border-primary-200 text-amber-700'
              }`}
            >
              ⏳ Pending Authority Clearance ({pendingCount})
            </Button>
            <Button
              variant={filterStatus === 'APPROVED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('APPROVED')}
              className={`rounded-2xl text-xs ${
                filterStatus === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-primary-200 text-emerald-700'
              }`}
            >
              ✅ Approved by Authority ({approvedCount})
            </Button>
            <Button
              variant={filterStatus === 'REJECTED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('REJECTED')}
              className={`rounded-2xl text-xs ${
                filterStatus === 'REJECTED' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'border-primary-200 text-rose-700'
              }`}
            >
              ❌ Rejected ({rejectedCount})
            </Button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, topic, or content..."
              className="pl-9 rounded-2xl text-xs border-primary-200"
            />
          </div>
        </div>

        {/* Table Card */}
        <Card className="rounded-2xl border border-primary-100 bg-white shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70">
                  <TableHead className="text-xs font-bold text-slate-700">Title & Topic</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Author & Submitter</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Clearance Status</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Target Audience</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Date</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-600 mx-auto" />
                      <p className="text-xs text-muted-foreground mt-2">Loading health tips from database...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredTips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                      No health tips found matching this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTips.map((tip) => {
                    const isPending = tip.status === 'PENDING_APPROVAL' || tip.status === 'DRAFT';
                    const isApproved = tip.status === 'APPROVED';
                    const isRejected = tip.status === 'REJECTED';

                    return (
                      <TableRow key={tip._id} className="hover:bg-slate-50/50">
                        <TableCell className="font-semibold text-slate-900 text-xs max-w-[280px]">
                          <p className="truncate" title={tip.title}>{tip.title}</p>
                          <Badge variant="outline" className="mt-1 text-[10px] font-medium border-primary-200 text-primary-700 bg-primary-50/50 rounded-lg">
                            {tip.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          <p className="font-medium text-slate-800 truncate max-w-[160px]">{tip.author}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {tip.submitterRole === 'ADMIN' ? 'Platform Admin' : tip.submitterRole === 'HEALTH_AUTHORITY' ? 'MINSANTÉ Authority' : 'Pharmacy'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {isPending && (
                            <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-semibold rounded-xl text-[11px] gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending Authority Clearance
                            </Badge>
                          )}
                          {isApproved && (
                            <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold rounded-xl text-[11px] gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Approved & Published
                            </Badge>
                          )}
                          {isRejected && (
                            <div className="space-y-0.5">
                              <Badge className="bg-rose-100 text-rose-800 border border-rose-300 font-semibold rounded-xl text-[11px] gap-1">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Rejected by Authority
                              </Badge>
                              {tip.reviewerNotes && (
                                <p className="text-[10px] text-rose-600 italic truncate max-w-[200px]" title={tip.reviewerNotes}>
                                  Note: {tip.reviewerNotes}
                                </p>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {tip.targetAudience || 'General Public'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(tip.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setSelectedTip(tip); setEditMode(false); setShowDialog(true); }}
                              className="h-8 w-8 p-0 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditTip(tip)}
                              className="h-8 w-8 p-0 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteTip(tip._id, tip.title)}
                              className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Modal: Create, Edit or View */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 border border-primary-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              {editMode ? (selectedTip ? 'Edit Health Tip' : 'Draft New Health Tip (Clearance Required)') : 'Health Tip Details'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editMode 
                ? 'Fill in the health advisory information. It will be routed for regulatory approval.'
                : `Reviewing compliance details and status for "${selectedTip?.title}".`}
            </DialogDescription>
          </DialogHeader>

          {editMode ? (
            <form onSubmit={handleSaveTip} className="space-y-4 mt-2">
              {/* Mandatory Notice */}
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  Mandatory Health Authority Clearance:
                </span>
                This health tip will be saved as a draft awaiting formal clearance from the Health Authority (MINSANTÉ/ONPC). Platform patients will only be able to view it after approval.
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Advisory Title *</Label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Early Warning Signs of Severe Malaria in Children"
                  className="rounded-2xl text-xs border-primary-200"
                />
              </div>

              {/* Category Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">Health Category *</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(!isCustomCategory);
                      if (!isCustomCategory) {
                        setCustomCategoryInput('');
                      }
                    }}
                    className="text-[11px] text-primary-600 hover:underline font-medium"
                  >
                    {isCustomCategory ? 'Choose from predefined list' : '+ Other custom category'}
                  </button>
                </div>

                {!isCustomCategory ? (
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs border border-primary-200 rounded-2xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                ) : (
                  <Input 
                    required
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="Enter the name of the new custom category..."
                    className="rounded-2xl text-xs border-primary-200"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Target Audience</Label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full text-xs border border-primary-200 rounded-2xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                  >
                    <option value="General Public">General Public (All Patients)</option>
                    <option value="Parents & Young Child Caregivers">Parents & Young Child Caregivers</option>
                    <option value="Pregnant Mothers">Pregnant Mothers (ANC)</option>
                    <option value="Elderly Population">Elderly Population</option>
                    <option value="Chronic Illness Patients">Chronic Illness Patients (Diabetes/Hypertension)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Priority Level</Label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full text-xs border border-primary-200 rounded-2xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="URGENT">URGENT (Public Health Alert)</option>
                    <option value="SEASONAL">Seasonal</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Author / Signatory Displayed</Label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="e.g., MediConnect Administration (Public Health Committee)"
                  className="rounded-2xl text-xs border-primary-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Advisory Content *</Label>
                <Textarea
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Provide clinical recommendations, preventive measures, dosage warnings, contraindications, and prompt emergency reflexes..."
                  className="rounded-2xl text-xs border-primary-200"
                />
              </div>

              <DialogFooter className="gap-2 pt-2 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowDialog(false)}
                  className="rounded-2xl text-xs border-primary-200 hover:bg-primary-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="gradient-bg-primary text-white rounded-2xl text-xs hover-lift shadow-soft px-5 font-semibold"
                >
                  {selectedTip ? 'Save Changes' : 'Submit Draft for Clearance'}
                </Button>
              </DialogFooter>
            </form>
          ) : selectedTip && (
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">{selectedTip.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="border-primary-200 text-primary-700 bg-primary-50/50 text-xs rounded-xl">
                    {selectedTip.category}
                  </Badge>
                  {selectedTip.status === 'PENDING_APPROVAL' && (
                    <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-semibold rounded-xl text-xs">
                      ⏳ Pending Health Authority Clearance
                    </Badge>
                  )}
                  {selectedTip.status === 'APPROVED' && (
                    <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold rounded-xl text-xs">
                      ✅ Approved by Authority & Visible to Patients
                    </Badge>
                  )}
                  {selectedTip.status === 'REJECTED' && (
                    <Badge className="bg-rose-100 text-rose-800 border border-rose-300 font-semibold rounded-xl text-xs">
                      ❌ Rejected by Health Authority
                    </Badge>
                  )}
                </div>
              </div>

              {selectedTip.status === 'REJECTED' && selectedTip.reviewerNotes && (
                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl text-xs text-rose-900">
                  <strong className="text-rose-950 font-bold block mb-1">Reason for Rejection by Health Authority:</strong>
                  {selectedTip.reviewerNotes}
                </div>
              )}

              {selectedTip.status === 'PENDING_APPROVAL' && (
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900">
                  This advisory is currently under review by the Health Authority (MINSANTÉ/ONPC). Once approved, it will be automatically published to all patients on the platform.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-muted-foreground block">Author:</span>
                  <span className="font-semibold text-slate-800">{selectedTip.author}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Target Audience:</span>
                  <span className="font-semibold text-slate-800">{selectedTip.targetAudience || 'General Public'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Priority:</span>
                  <span className="font-semibold text-slate-800">{selectedTip.priority || 'STANDARD'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Creation Date:</span>
                  <span className="font-semibold text-slate-800">{new Date(selectedTip.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Advisory Content:</Label>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedTip.content}
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2 border-t">
                <Button 
                  onClick={() => handleEditTip(selectedTip)}
                  className="gradient-bg-primary text-white rounded-2xl text-xs font-semibold shadow-soft"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDialog(false)}
                  className="rounded-2xl text-xs border-primary-200 hover:bg-primary-50"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}