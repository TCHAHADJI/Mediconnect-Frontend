import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '../ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { toast } from 'sonner';
import { 
  Shield, 
  Activity, 
  Download, 
  FileText, 
  Megaphone, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  Plus, 
  Building2, 
  Users, 
  MapPin, 
  Calendar, 
  Flame, 
  Radio, 
  Sparkles, 
  FileSpreadsheet, 
  LogOut, 
  Clock, 
  Share2, 
  Pill,
  Send,
  Eye,
  Check,
  TrendingUp,
  BarChart3,
  Globe2,
  Menu,
  BrainCircuit,
  Database,
  ArrowUpRight,
  ShieldAlert,
  HelpCircle,
  Package,
  Heart,
  Edit,
  Trash2,
  CheckSquare,
  Square,
  Info
} from 'lucide-react';
import { AnimatedWrapper } from '../ui/animations';

const CAMEROON_REGIONS = [
  'Adamaoua',
  'Centre',
  'Est',
  'Extrême-Nord',
  'Littoral',
  'Nord',
  'Nord-Ouest',
  'Ouest',
  'Sud',
  'Sud-Ouest'
];

interface HealthAuthorityPortalProps {
  onLogout?: () => void;
  embedded?: boolean;
}

export function HealthAuthorityPortal({ onLogout, embedded = false }: HealthAuthorityPortalProps) {
  const [activeTab, setActiveTab] = useState('epidemiology');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Data states
  const [telemetry, setTelemetry] = useState<any>(null);
  const [healthTips, setHealthTips] = useState<any[]>([]);
  const [tipsStats, setTipsStats] = useState<any>({ pendingCount: 0, approvedCount: 0, totalCount: 0 });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignStats, setCampaignStats] = useState<any>({ activeCount: 0, scheduledCount: 0, totalCount: 0 });
  const [equivalences, setEquivalences] = useState<any[]>([]);
  const [recalls, setRecalls] = useState<any[]>([]);

  // Filter states
  const [tipsFilter, setTipsFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'>('PENDING_APPROVAL');
  const [campaignFilter, setCampaignFilter] = useState<'ALL' | 'ACTIVE' | 'SCHEDULED' | 'COMPLETED'>('ALL');
  const [epidemioRegionFilter, setEpidemioRegionFilter] = useState('ALL');

  // Modals
  const [isDhis2PreviewOpen, setIsDhis2PreviewOpen] = useState(false);
  const [dhis2PreviewData, setDhis2PreviewData] = useState<any>(null);
  const [isAiExplanationOpen, setIsAiExplanationOpen] = useState(false);
  const [isCreateTipOpen, setIsCreateTipOpen] = useState(false);
  const [isRejectTipOpen, setIsRejectTipOpen] = useState(false);
  const [selectedTipToReject, setSelectedTipToReject] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);

  // Forms
  const DEFAULT_TIP_CATEGORIES = [
    'Paludisme & Moustiquaires',
    'Hygiène & Prévention Choléra',
    'Santé Maternelle & Infantile',
    'Vaccination & PEV',
    'Maladies Cardiovasculaires & HTA',
    'Diabète & Alimentation',
    'Dangers de l Automédication',
    'Usage Rationnel des Antibiotiques',
    'Conservation des Médicaments',
    'Santé Mentale & Gestion du Stress',
    'Santé Sexuelle & Reproductive',
    'Nutrition & Hydratation',
    'Premiers Secours & Urgences',
    'Santé Oculaire & Vision',
    'Tabagisme & Addictions',
    'Santé Respiratoire & Asthme',
    'Malaria Prevention',
    'Hygiene & Sanitation',
    'Rational Drug Use'
  ];

  const [availableTipCategories, setAvailableTipCategories] = useState<string[]>(DEFAULT_TIP_CATEGORIES);
  const [isCustomTipCategory, setIsCustomTipCategory] = useState(false);
  const [customTipCategoryInput, setCustomTipCategoryInput] = useState('');

  const [newTipForm, setNewTipForm] = useState({
    title: '',
    category: DEFAULT_TIP_CATEGORIES[0],
    targetAudience: 'General Public',
    priority: 'STANDARD',
    content: ''
  });

  const [campaignFormData, setCampaignFormData] = useState({
    title: '',
    theme: 'MALARIA_PREVENTION',
    description: '',
    objectives: '',
    targetRegions: [...CAMEROON_REGIONS] as string[],
    targetAudience: 'Population générale',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    budgetOrPartner: 'MINSANTÉ Cameroun / Partenaires Internationaux (OMS, UNICEF, Fonds Mondial)',
    priority: 'HIGH',
    preventionDirectives: '',
    pharmacyDirectives: '',
    keyMessages: '',
    estimatedReach: 50000,
    broadcastAlert: true
  });

  const [recallForm, setRecallForm] = useState({
    batchNumber: '',
    medicineName: '',
    reason: 'Suspicion of bacterial contamination / LNSPM non-compliance',
    severity: 'CRITICAL',
    broadcastToPublic: true
  });

  const getAuthToken = () => {
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        return JSON.parse(session).token;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setCurrentUser(parsed.user);
      } catch (e) {
        console.error('Error loading session user', e);
      }
    }
  }, []);

  const fetchAuthorityData = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const [telRes, tipsRes, campRes, eqRes, recRes, catRes] = await Promise.all([
        fetch(`${apiBase}/authority/telemetry/epidemiological`, { headers }),
        fetch(`${apiBase}/authority/health-tips?status=ALL`, { headers }),
        fetch(`${apiBase}/authority/campaigns`, { headers }),
        fetch(`${apiBase}/authority/equivalences`, { headers }),
        fetch(`${apiBase}/authority/recalls`, { headers }),
        fetch(`${apiBase}/health-tips/categories`, { headers }).catch(() => null),
      ]);

      const [telData, tipsData, campData, eqData, recData, catData] = await Promise.all([
        telRes.json(), 
        tipsRes.json(), 
        campRes.json(), 
        eqRes.json(), 
        recRes.json(),
        catRes ? catRes.json().catch(() => null) : null
      ]);

      if (telData.success) setTelemetry(telData.data || null);
      if (tipsData.success) {
        setHealthTips(tipsData.data?.tips || []);
        setTipsStats(tipsData.data?.stats || { pendingCount: 0, approvedCount: 0, totalCount: 0 });
      }
      if (catData?.success && Array.isArray(catData.data) && catData.data.length > 0) {
        setAvailableTipCategories(catData.data);
      }
      if (campData.success) {
        setCampaigns(campData.data?.campaigns || []);
        setCampaignStats(campData.data?.stats || { activeCount: 0, scheduledCount: 0, totalCount: 0 });
      }
      if (eqData.success) setEquivalences(eqData.data || []);
      if (recData.success) setRecalls(recData.data || []);
    } catch (err: any) {
      console.error('Error fetching authority data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthorityData();
  }, []);

  const handleSeedData = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/authority/seed`);
      const data = await res.json();
      if (data.success) {
        toast.success('Demonstration dataset re-initialized successfully!');
        fetchAuthorityData();
      }
    } catch (err) {
      toast.error('Failed to seed demo dataset.');
    }
  };

  // ==========================================
  // DHIS2 EXPORTS
  // ==========================================

  const handleExportDhis2Json = async () => {
    const token = getAuthToken();
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const res = await fetch(`${apiBase}/authority/export/dhis2/json`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      const jsonStr = JSON.stringify(data.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dhis2_dataset_${data.data?.period || 'export'}_minsante.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('DHIS2 JSON DataValueSet file downloaded successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Error exporting DHIS2 JSON');
    }
  };

  const handlePreviewDhis2 = async () => {
    const token = getAuthToken();
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const res = await fetch(`${apiBase}/authority/export/dhis2/json`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDhis2PreviewData(data.data);
        setIsDhis2PreviewOpen(true);
      }
    } catch (err) {
      toast.error('Failed to load DHIS2 payload preview');
    }
  };

  const handleExportDhis2Csv = async () => {
    const token = getAuthToken();
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const res = await fetch(`${apiBase}/authority/export/dhis2/csv`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const csvText = await res.text();

      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dhis2_dataset_cameroon_export.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('DHIS2 CSV file downloaded successfully!');
    } catch (err: any) {
      toast.error('Error exporting DHIS2 CSV');
    }
  };

  // ==========================================
  // HEALTH TIPS APPROVAL & CREATION
  // ==========================================

  const handleApproveTip = async (tipId: string) => {
    const token = getAuthToken();
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const res = await fetch(`${apiBase}/authority/health-tips/${tipId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'APPROVED',
          reviewerNotes: 'Validated and certified compliant by the National Health Authority (MINSANTÉ/ONPC).'
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Health tip approved and published to all patients!');
        fetchAuthorityData();
      } else {
        toast.error(data.message || 'Error approving health tip');
      }
    } catch (err) {
      toast.error('Network error during approval');
    }
  };

  const handleOpenRejectModal = (tip: any) => {
    setSelectedTipToReject(tip);
    setRejectionReason('Incomplete content or non-compliant with National Clinical Guidelines.');
    setIsRejectTipOpen(true);
  };

  const handleConfirmRejectTip = async () => {
    if (!selectedTipToReject) return;
    const token = getAuthToken();
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const res = await fetch(`${apiBase}/authority/health-tips/${selectedTipToReject._id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'REJECTED',
          reviewerNotes: rejectionReason
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Health tip rejected. The creator has been notified with your reason.');
        setIsRejectTipOpen(false);
        setSelectedTipToReject(null);
        fetchAuthorityData();
      }
    } catch (err) {
      toast.error('Error rejecting health tip');
    }
  };

  const handleCreateOfficialTip = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const chosenCategory = isCustomTipCategory ? customTipCategoryInput.trim() : newTipForm.category;
    if (!chosenCategory) {
      toast.error('Please specify or select a health category');
      return;
    }

    try {
      const res = await fetch(`${apiBase}/authority/health-tips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newTipForm,
          category: chosenCategory
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success('Official MINSANTÉ health advisory published successfully to database!');
      setIsCreateTipOpen(false);
      setIsCustomTipCategory(false);
      setCustomTipCategoryInput('');
      setNewTipForm({
        title: '',
        category: availableTipCategories[0] || 'Malaria & Bed Net Prevention',
        targetAudience: 'General Public',
        priority: 'STANDARD',
        content: ''
      });
      fetchAuthorityData();
    } catch (err: any) {
      toast.error(err.message || 'Error creating health tip');
    }
  };

  // ==========================================
  // CAMPAIGNS CREATION & MANAGEMENT
  // ==========================================

  const calculateDaysRemaining = (endDateStr?: string) => {
    if (!endDateStr) return null;
    const end = new Date(endDateStr);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatPeriodDate = (dateStr?: string) => {
    if (!dateStr) return 'Indéterminée';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const handleToggleRegion = (region: string) => {
    setCampaignFormData(prev => {
      const exists = prev.targetRegions.includes(region);
      const updated = exists
        ? prev.targetRegions.filter(r => r !== region)
        : [...prev.targetRegions, region];
      return { ...prev, targetRegions: updated };
    });
  };

  const handleToggleAllRegions = () => {
    setCampaignFormData(prev => ({
      ...prev,
      targetRegions: prev.targetRegions.length === CAMEROON_REGIONS.length ? [] : [...CAMEROON_REGIONS]
    }));
  };

  const handleOpenCreateCampaign = () => {
    setEditingCampaignId(null);
    setCampaignFormData({
      title: '',
      theme: 'MALARIA_PREVENTION',
      description: '',
      objectives: '',
      targetRegions: [...CAMEROON_REGIONS],
      targetAudience: 'Population générale',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budgetOrPartner: 'MINSANTÉ Cameroun / Partenaires Internationaux (OMS, UNICEF, Fonds Mondial)',
      priority: 'HIGH',
      preventionDirectives: '',
      pharmacyDirectives: '',
      keyMessages: '',
      estimatedReach: 50000,
      broadcastAlert: true
    });
    setIsCreateCampaignOpen(true);
  };

  const handleOpenEditCampaign = (camp: any) => {
    setEditingCampaignId(camp._id);
    let regions: string[] = [];
    if (Array.isArray(camp.targetRegions) && camp.targetRegions.length > 0) {
      if (
        camp.targetRegions.some((r: string) => r.includes('(National)'))
      ) {
        regions = [...CAMEROON_REGIONS];
      } else {
        regions = camp.targetRegions.filter((r: string) => CAMEROON_REGIONS.includes(r));
        if (regions.length === 0) regions = [...CAMEROON_REGIONS];
      }
    } else {
      regions = [...CAMEROON_REGIONS];
    }

    const prevDirectives = camp.preventionDirectives && camp.preventionDirectives.length > 0
      ? camp.preventionDirectives.join('\n')
      : (camp.keyMessages ? camp.keyMessages.join('\n') : '');

    const pharmDirectives = camp.pharmacyDirectives && camp.pharmacyDirectives.length > 0
      ? camp.pharmacyDirectives.join('\n')
      : '';

    setCampaignFormData({
      title: camp.title || '',
      theme: camp.theme || 'MALARIA_PREVENTION',
      description: camp.description || '',
      objectives: camp.objectives || '',
      targetRegions: regions,
      targetAudience: camp.targetAudience || 'Population générale',
      startDate: camp.startDate ? new Date(camp.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: camp.endDate ? new Date(camp.endDate).toISOString().split('T')[0] : '',
      budgetOrPartner: camp.budgetOrPartner || 'MINSANTÉ Cameroun / Partenaires Internationaux',
      priority: camp.priority || 'HIGH',
      preventionDirectives: prevDirectives,
      pharmacyDirectives: pharmDirectives,
      keyMessages: camp.keyMessages ? camp.keyMessages.join('\n') : '',
      estimatedReach: camp.estimatedReach || 50000,
      broadcastAlert: false
    });
    setIsCreateCampaignOpen(true);
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    if (campaignFormData.targetRegions.length === 0) {
      toast.error('Veuillez cocher au moins une région concernée par la campagne');
      return;
    }

    if (campaignFormData.endDate && new Date(campaignFormData.endDate) < new Date(campaignFormData.startDate)) {
      toast.error('La date de clôture de la campagne ne peut pas être antérieure à la date de début');
      return;
    }

    try {
      const prevMsgsArray = campaignFormData.preventionDirectives
        ? campaignFormData.preventionDirectives.split('\n').map(s => s.trim()).filter(Boolean)
        : [];

      const pharmMsgsArray = campaignFormData.pharmacyDirectives
        ? campaignFormData.pharmacyDirectives.split('\n').map(s => s.trim()).filter(Boolean)
        : [];

      const combinedKeyMessages = [...prevMsgsArray, ...pharmMsgsArray];

      const payload = {
        title: campaignFormData.title.trim(),
        theme: campaignFormData.theme,
        description: campaignFormData.description.trim(),
        objectives: campaignFormData.objectives.trim(),
        targetRegions: campaignFormData.targetRegions.length === CAMEROON_REGIONS.length 
          ? ['Toutes les 10 régions (National)', ...campaignFormData.targetRegions]
          : campaignFormData.targetRegions,
        targetAudience: campaignFormData.targetAudience,
        startDate: campaignFormData.startDate,
        endDate: campaignFormData.endDate || null,
        budgetOrPartner: campaignFormData.budgetOrPartner,
        priority: campaignFormData.priority,
        preventionDirectives: prevMsgsArray,
        pharmacyDirectives: pharmMsgsArray,
        keyMessages: combinedKeyMessages,
        estimatedReach: Number(campaignFormData.estimatedReach) || 25000,
        broadcastAlert: campaignFormData.broadcastAlert
      };

      if (editingCampaignId) {
        // Edit mode (PUT)
        const res = await fetch(`${apiBase}/authority/campaigns/${editingCampaignId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        toast.success('Campagne sanitaire mise à jour avec succès dans la base de données !');
      } else {
        // Create mode (POST)
        const res = await fetch(`${apiBase}/authority/campaigns`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        toast.success('Campagne sanitaire nationale lancée et diffusée avec succès !');
      }

      setIsCreateCampaignOpen(false);
      setEditingCampaignId(null);
      fetchAuthorityData();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l enregistrement de la campagne');
    }
  };

  const handleDeleteCampaign = async (campaignId: string, title: string) => {
    if (!window.confirm(`Êtes-vous certain de vouloir supprimer la campagne "${title}" ? Cette action est irréversible.`)) {
      return;
    }

    const token = getAuthToken();
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const res = await fetch(`${apiBase}/authority/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success('Campagne supprimée avec succès de la base de données');
      fetchAuthorityData();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression de la campagne');
    }
  };

  const handleToggleCampaignStatus = async (campaignId: string, currentStatus: string) => {
    const token = getAuthToken();
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const nextStatus = currentStatus === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE';

    try {
      const res = await fetch(`${apiBase}/authority/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Campaign status updated to: ${nextStatus}`);
        fetchAuthorityData();
      }
    } catch (err) {
      toast.error('Error toggling campaign status');
    }
  };

  // ==========================================
  // BATCH RECALL HANDLER
  // ==========================================

  const handleTriggerRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const res = await fetch(`${apiBase}/authority/recalls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(recallForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(`Emergency recall alert broadcasted! Stocks frozen across all pharmacy inventories.`);
      setIsRecallModalOpen(false);
      setRecallForm({
        batchNumber: '',
        medicineName: '',
        reason: 'Suspicion of bacterial contamination / LNSPM non-compliance',
        severity: 'CRITICAL',
        broadcastToPublic: true
      });
      fetchAuthorityData();
    } catch (err: any) {
      toast.error(err.message || 'Error triggering batch recall');
    }
  };

  // Filtered lists
  const filteredTips = healthTips.filter(tip => {
    if (tipsFilter === 'ALL') return true;
    return tip.status === tipsFilter;
  });

  const filteredCampaigns = campaigns.filter(c => {
    if (campaignFilter === 'ALL') return true;
    return c.status === campaignFilter;
  });

  const filteredSignals = (telemetry?.signals || []).filter((s: any) => {
    if (epidemioRegionFilter === 'ALL') return true;
    return s.region === epidemioRegionFilter;
  });

  // Navigation Items on the Left Sidebar matching MediConnect Brand
  const navigationItems = [
    {
      id: 'epidemiology',
      label: 'Epidemiological Surveillance & DHIS2',
      shortLabel: 'Surveillance & DHIS2',
      icon: <Activity className="w-4 h-4" />,
      badge: telemetry?.summary?.outbreakWarnings ? `${telemetry.summary.outbreakWarnings} alerts` : undefined,
    },
    {
      id: 'health-tips',
      label: 'Health Tips Approvals (Admin Drafts)',
      shortLabel: 'Health Tips Approvals',
      icon: <FileText className="w-4 h-4" />,
      badge: tipsStats.pendingCount > 0 ? `${tipsStats.pendingCount}` : undefined,
    },
    {
      id: 'campaigns',
      label: 'Public Health Campaigns',
      shortLabel: 'National Campaigns',
      icon: <Megaphone className="w-4 h-4" />,
      badge: campaignStats.activeCount > 0 ? `${campaignStats.activeCount} active` : undefined,
    },
    {
      id: 'regulation',
      label: 'Bioequivalence & Batch Recalls',
      shortLabel: 'Bioequivalence & Recalls',
      icon: <Shield className="w-4 h-4" />,
      badge: recalls.length > 0 ? `${recalls.length}` : undefined,
    }
  ];

  return (
    <div className={`min-h-screen text-slate-800 ${embedded ? '' : 'flex flex-col lg:flex-row'}`}>

      {/* ========================================================================= */}
      {/* EMBEDDED MODE SUB-NAVIGATION (when rendered inside AdminDashboard)       */}
      {/* ========================================================================= */}
      {embedded && (
        <div className="flex items-center gap-2 border-b border-gray-200 pb-4 mb-6 flex-wrap">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? 'default' : 'ghost'}
              className={`rounded-2xl transition-all duration-300 text-xs ${
                activeTab === item.id 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'hover:bg-blue-600 hover:text-white text-gray-700 bg-white border border-gray-200'
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="mr-2">{item.icon}</span>
              {item.shortLabel}
              {item.badge && (
                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === item.id ? 'bg-white/20 text-white font-bold' : 'bg-blue-100 text-blue-700 font-semibold'
                }`}>
                  {item.badge}
                </span>
              )}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedData}
            className="ml-auto rounded-2xl border-gray-200 text-gray-600 hover:bg-blue-50 text-xs"
            title="Seed demo data"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Seed Demo
          </Button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STANDALONE MODE: MOBILE HEADER (with Drawer Sheet)                        */}
      {/* ========================================================================= */}
      {!embedded && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-2xl">
                <Menu className="w-5 h-5 text-gray-700" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="p-4 border-b bg-blue-50 border-blue-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <SheetTitle className="text-left text-lg font-semibold text-gray-900">MediConnect</SheetTitle>
                    <SheetDescription className="text-left text-sm text-muted-foreground font-bold">
                      Health Authority
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <nav className="p-4 space-y-2">
                {navigationItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? 'default' : 'ghost'}
                    className={`w-full justify-start rounded-2xl transition-all duration-300 ${
                      activeTab === item.id 
                        ? 'bg-purple-600 text-white' 
                        : 'hover:bg-blue-600 hover:text-white text-gray-700'
                    }`}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span className="truncate">{item.shortLabel}</span>
                    {item.badge && (
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                        activeTab === item.id ? 'bg-white/20 text-white font-bold' : 'bg-blue-100 text-blue-700 font-semibold'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Button>
                ))}
              </nav>

              {/* Mobile Footer Profile */}
              <div className="p-4 border-t border-gray-200 mt-auto">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                      {currentUser?.name?.[0] || 'HA'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900">{currentUser?.name || 'Dr. Salihou Sadou'}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentUser?.institutionDepartment || 'MINSANTÉ Cameroun'}</p>
                  </div>
                </div>

                {onLogout && (
                  <Button 
                    variant="ghost" 
                    onClick={onLogout}
                    className="w-full justify-start hover:bg-red-50 hover:text-red-600 transition-colors rounded-2xl text-xs"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Logout
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Health Authority</h1>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSeedData} 
            className="rounded-2xl border-gray-200 text-gray-700 hover:bg-blue-50 text-xs"
            title="Seed demo data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STANDALONE MODE: FIXED DESKTOP SIDEBAR (Identical to AdminDashboard)      */}
      {/* ========================================================================= */}
      {!embedded && (
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white border-r border-blue-300">
            
            {/* Logo & Brand matching AdminDashboard */}
            <div className="flex items-center px-4 py-6 border-b bg-blue-50 border-blue-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">MediConnect</h1>
                  <p className="text-sm text-muted-foreground font-bold">Health Authority</p>
                </div>
              </div>
            </div>

            {/* Navigation Menu with AdminDashboard colors */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? 'default' : 'ghost'}
                  className={`w-full justify-start rounded-2xl transition-all duration-300 ${
                    activeTab === item.id 
                      ? 'bg-purple-600 text-white shadow-sm' 
                      : 'hover:bg-blue-600 hover:text-white text-gray-700'
                  }`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="truncate">{item.shortLabel}</span>
                  {item.badge && (
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      activeTab === item.id ? 'bg-white/20 text-white font-bold' : 'bg-blue-100 text-blue-700 font-semibold'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Button>
              ))}

              <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 pb-2">
                  System Tools
                </p>
                <Button
                  variant="ghost"
                  onClick={handleSeedData}
                  className="w-full justify-start text-xs rounded-2xl hover:bg-blue-50 hover:text-blue-700 text-gray-600"
                >
                  <RefreshCw className={`w-4 h-4 mr-3 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
                  Re-seed Demo Data
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setIsAiExplanationOpen(true)}
                  className="w-full justify-start text-xs rounded-2xl hover:bg-purple-50 hover:text-purple-700 text-gray-600 mt-1"
                >
                  <BrainCircuit className="w-4 h-4 mr-3 text-purple-600" />
                  How AI Works
                </Button>
              </div>
            </nav>

            {/* User Profile & Logout at Bottom matching AdminDashboard */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                    {currentUser?.name?.[0] || 'HA'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-gray-900">{currentUser?.name || 'Dr. Salihou Sadou'}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentUser?.institutionDepartment || 'MINSANTÉ Cameroun'}</p>
                </div>
              </div>

              {onLogout && (
                <Button 
                  variant="ghost" 
                  onClick={onLogout} 
                  className="w-full justify-start hover:bg-red-50 hover:text-red-600 transition-colors rounded-2xl text-xs"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA                                                         */}
      {/* ========================================================================= */}
      <div className={`flex-1 ${embedded ? '' : 'lg:ml-64'}`}>
        <main className={`${embedded ? '' : 'p-4 lg:p-6'} space-y-6`}>

          {/* Welcome Section (matching PatientDashboard & PharmacyDashboard) */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-2xl border border-blue-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge className="bg-blue-600 text-white font-medium text-xs rounded-xl">
                    {currentUser?.organization === 'ONPC' ? 'National Order of Pharmacists (ONPC)' : 'Republic of Cameroon • MINSANTÉ'}
                  </Badge>
                  <Badge variant="outline" className="border-blue-200 text-blue-700 bg-white rounded-xl text-xs">
                    {currentUser?.institutionDepartment || 'Directorate of Pharmacy, Medicine and Laboratories'}
                  </Badge>
                  <span className="flex items-center gap-1.5 text-xs text-green-700 font-medium bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Sentinel Surveillance Active
                  </span>
                </div>
                <h1 className="text-2xl font-semibold mb-2 text-gray-900">
                  National Health Authority Portal
                </h1>
                <p className="text-sm text-muted-foreground">
                  Predictive syndromic surveillance, DHIS2 interoperability, clinical tips clearance & public health campaigns.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAiExplanationOpen(true)}
                  className="hidden sm:flex rounded-2xl hover:bg-purple-600 hover:text-white transition-colors border-blue-200 bg-white text-blue-700"
                >
                  <BrainCircuit className="w-4 h-4 mr-2 text-blue-600" />
                  How AI Works
                </Button>
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center cursor-pointer shadow-sm border border-blue-100">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold text-lg">
                      {currentUser?.name?.[0] || 'HA'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Key Metrics matching PharmacyDashboard & PatientDashboard design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border border-gray-200 hover:shadow-md transition-shadow bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground text-gray-500">Surveillance Alerts</p>
                    <p className="text-2xl font-bold text-black mt-1">{telemetry?.summary?.outbreakWarnings || 2}</p>
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-1 font-medium">
                      <TrendingUp className="w-3 h-3" />
                      Top Spike: {telemetry?.summary?.topDiseaseSurge || 'MALARIA'} (+342%)
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                    <Activity className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-gray-200 hover:shadow-md transition-shadow bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground text-gray-500">Tips Pending Clearance</p>
                    <p className="text-2xl font-bold text-black mt-1">{tipsStats.pendingCount}</p>
                    <p className="text-xs text-purple-600 flex items-center gap-1 mt-1 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      {tipsStats.approvedCount} official tips active
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-gray-200 hover:shadow-md transition-shadow bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground text-gray-500">National Campaigns</p>
                    <p className="text-2xl font-bold text-black mt-1">{campaignStats.activeCount}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1 font-medium">
                      <Globe2 className="w-3 h-3 text-green-600" />
                      Reach: ~600k+ citizens
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                    <Megaphone className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-gray-200 hover:shadow-md transition-shadow bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground text-gray-500">Vigilance & Recalls</p>
                    <p className="text-2xl font-bold text-black mt-1">{recalls.length}</p>
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      48+ Sentinel pharmacies
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* ========================================================================= */}
        {/* TAB 1: EPIDEMIOLOGICAL SURVEILLANCE & DHIS2 EXPORTS                       */}
        {/* ========================================================================= */}
        {activeTab === 'epidemiology' && (
          <div className="space-y-6">

            {/* AI DRUG SEARCH SURVEILLANCE HERO CARD */}
            <Card className="rounded-2xl border border-primary-100 bg-white shadow-soft overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="gradient-bg-primary text-white font-medium text-xs flex items-center gap-1">
                        <BrainCircuit className="w-3.5 h-3.5" />
                        AI SYNDROMIC DRUG-SEARCH SURVEILLANCE
                      </Badge>
                      <span className="text-xs text-primary-700 font-semibold font-mono">
                        Early Warning Telemetry
                      </span>
                    </div>
                    <CardTitle className="text-xl text-slate-900 mt-1">
                      Predictive Disease Outbreak Telemetry via Drug Search Frequencies
                    </CardTitle>
                    <CardDescription className="text-muted-foreground max-w-3xl">
                      When patients and pharmacies in a specific locality (e.g., Douala Bonabéri or Yaoundé Biyem-Assi) perform an unusual number of searches for specific medicines (e.g., <em>Oral Rehydration Salts</em> or <em>Artemether/Lumefantrine</em>), MediConnect's AI calculates the anomaly against 30-day baseline statistics and generates early epidemic outbreak alarms.
                    </CardDescription>
                  </div>

                  <Button
                    onClick={() => setIsAiExplanationOpen(true)}
                    variant="outline"
                    className="border-primary-200 text-primary-700 bg-primary-50/50 hover:bg-primary-50 rounded-2xl text-xs font-semibold shrink-0 hover-lift shadow-soft"
                  >
                    View Algorithmic Pipeline
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* DHIS2 Interoperability Hub */}
            <Card className="rounded-2xl border border-primary-100 bg-white shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-secondary-50 text-secondary-700 border border-secondary-200 font-semibold">
                        MINSANTÉ / WHO INTEROPERABILITY
                      </Badge>
                      <span className="text-xs text-primary-700 font-mono font-medium">
                        Standard DHIS2 DataValueSet 2.38+
                      </span>
                    </div>
                    <CardTitle className="text-lg text-slate-900">
                      Export Epidemiological DataValueSet into National DHIS2
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Export syndromic indicators and anomaly volumes directly into Cameroon's Health Management Information System (SNIS / DHIS2).
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Button 
                      onClick={handleExportDhis2Json}
                      className="gradient-bg-primary text-white shadow-soft hover-lift rounded-2xl text-xs font-medium"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export DHIS2 (JSON)
                    </Button>

                    <Button 
                      onClick={handleExportDhis2Csv}
                      variant="outline"
                      className="border-primary-200 text-primary-700 hover:bg-primary-50 bg-white rounded-2xl shadow-soft text-xs font-medium hover-lift"
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2 text-secondary-600" />
                      Export DHIS2 (CSV)
                    </Button>

                    <Button 
                      onClick={handlePreviewDhis2}
                      variant="ghost"
                      className="text-slate-600 hover:bg-primary-50 rounded-2xl text-xs"
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      Preview Payload
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Regional Signals & Drug Search Breakdown */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Live Epidemiological Signals & Drug Spikes</h3>
                  <p className="text-xs text-muted-foreground">Correlated disease classifications based on geolocated drug availability searches and symptom spikes</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Filter by Region:</span>
                  <select
                    value={epidemioRegionFilter}
                    onChange={(e) => setEpidemioRegionFilter(e.target.value)}
                    className="text-xs border border-primary-200 rounded-2xl px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-soft"
                  >
                    <option value="ALL">All 10 Regions of Cameroon</option>
                    <option value="Littoral">Littoral (Douala)</option>
                    <option value="Centre">Centre (Yaoundé)</option>
                    <option value="Extrême-Nord">Extrême-Nord (Maroua)</option>
                    <option value="Ouest">Ouest (Bafoussam)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSignals.map((signal: any, idx: number) => {
                  const isOutbreak = signal.alertLevel === 'OUTBREAK_WARNING';
                  return (
                    <Card 
                      key={idx} 
                      className={`rounded-2xl border transition-all hover:shadow-md bg-white ${
                        isOutbreak ? 'border-amber-300 shadow-soft' : 'border-primary-100 shadow-soft'
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={isOutbreak ? 'bg-red-500 text-white rounded-xl' : 'gradient-bg-primary text-white rounded-xl'}>
                                {signal.diseaseCategory || 'EPIDEMIC'}
                              </Badge>
                              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-primary-500" />
                                {signal.region} • {signal.district}
                              </span>
                            </div>
                            <CardTitle className="text-base text-slate-900 mt-1">
                              {signal.diseaseCategory} Anomaly in {signal.district}
                            </CardTitle>
                          </div>

                          <div className="text-right">
                            <Badge 
                              variant="outline" 
                              className={`font-mono font-bold rounded-xl ${
                                signal.anomalyPercentage > 100 
                                  ? 'border-red-400 text-red-600 bg-red-50' 
                                  : 'border-amber-400 text-amber-700 bg-amber-50'
                              }`}
                            >
                              +{signal.anomalyPercentage}%
                            </Badge>
                            <p className="text-[11px] text-muted-foreground mt-1">vs 30-day baseline</p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-0">
                        {/* Drug Searches Triggering this Anomaly */}
                        <div className="bg-primary-50/70 p-3 rounded-2xl border border-primary-100 text-xs space-y-1">
                          <div className="flex items-center justify-between text-primary-900 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <Pill className="w-3.5 h-3.5 text-primary-600" />
                              Drugs Searched in this Locality:
                            </span>
                            <span className="text-[11px] text-primary-700 font-mono font-bold">
                              AI Confidence: {signal.aiConfidence || 94}%
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {(signal.correlatedDrugs || ['Coartem 20/120mg', 'Paracetamol 500mg']).map((drug: string, i: number) => (
                              <span key={i} className="bg-white text-primary-900 font-medium px-2 py-0.5 rounded-lg border border-primary-200 text-[11px] shadow-sm">
                                {drug}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Search Volumes */}
                        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-muted-foreground">Query Volume: </span>
                            <span className="font-bold text-slate-900">{signal.searchVolume} searches</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Normal Baseline: </span>
                            <span className="font-bold text-slate-700">{signal.baselineVolume}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600">
                            <Radio className="w-3 h-3 text-primary-500" />
                            <span>Mobile: {signal.channelSpikes?.mobile || '-'}</span>
                          </div>
                        </div>

                        {/* Symptoms */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 font-medium">Correlated Symptom Queries:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(signal.symptomKeywords || []).map((kw: string, i: number) => (
                              <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Recommended Public Health Directive */}
                        <div className="p-2.5 rounded-2xl bg-secondary-50/70 border border-secondary-200 text-xs text-secondary-900">
                          <span className="font-semibold">Recommended Intervention: </span>
                          {signal.recommendedAction || 'Emergency stock replenishment and active surveillance.'}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: HEALTH TIPS APPROVALS (VALIDATING ADMIN DRAFTS)                    */}
        {/* ========================================================================= */}
        {activeTab === 'health-tips' && (
          <div className="space-y-6">
            
            {/* Header with Quick Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-primary-100 shadow-soft">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-sm">
                    ADMIN DRAFTS CLEARANCE DESK
                  </Badge>
                  <span className="text-xs text-muted-foreground">Mandatory Regulatory Clearance</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Health Tips Approvals & Editorial Clearance
                </h2>
                <p className="text-xs text-muted-foreground">
                  Review and approve draft health advice submitted by the <strong>System Administrator</strong> and medical practitioners before public broadcasting to patients.
                </p>
              </div>

              <Button 
                onClick={() => setIsCreateTipOpen(true)}
                className="gradient-bg-primary text-white shadow-soft hover-lift rounded-2xl text-xs font-medium self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Draft Official Authority Tip
              </Button>
            </div>

            {/* Sub-Filters */}
            <div className="flex items-center gap-2 border-b border-primary-100 pb-3 flex-wrap">
              <Button
                variant={tipsFilter === 'PENDING_APPROVAL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTipsFilter('PENDING_APPROVAL')}
                className={`rounded-2xl text-xs hover-lift transition-all duration-200 ${
                  tipsFilter === 'PENDING_APPROVAL' 
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-soft' 
                    : 'text-slate-600 border-primary-200 hover:bg-primary-50'
                }`}
              >
                Pending Admin Review ({tipsStats.pendingCount})
              </Button>

              <Button
                variant={tipsFilter === 'APPROVED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTipsFilter('APPROVED')}
                className={`rounded-2xl text-xs hover-lift transition-all duration-200 ${
                  tipsFilter === 'APPROVED' 
                    ? 'gradient-bg-primary text-white shadow-soft' 
                    : 'text-slate-600 border-primary-200 hover:bg-primary-50'
                }`}
              >
                Approved & Active ({tipsStats.approvedCount})
              </Button>

              <Button
                variant={tipsFilter === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTipsFilter('ALL')}
                className={`rounded-2xl text-xs hover-lift transition-all duration-200 ${
                  tipsFilter === 'ALL' 
                    ? 'bg-slate-800 text-white shadow-soft' 
                    : 'text-slate-600 border-primary-200 hover:bg-primary-50'
                }`}
              >
                All Tips ({tipsStats.totalCount})
              </Button>
            </div>

            {/* Tips List */}
            <div className="grid grid-cols-1 gap-4">
              {filteredTips.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-primary-100 p-8 shadow-soft">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h4 className="text-base font-semibold text-slate-700">No health tips found in this category</h4>
                  <p className="text-xs text-muted-foreground mt-1">All admin drafts have been cleared or no items match your selected filter.</p>
                </div>
              ) : (
                filteredTips.map((tip: any) => {
                  const isPending = tip.status === 'PENDING_APPROVAL' || tip.status === 'DRAFT';
                  const isApproved = tip.status === 'APPROVED';
                  const isAdminDraft = tip.submitterRole === 'ADMIN' || tip.author?.toLowerCase().includes('admin');

                  return (
                    <Card key={tip._id} className="rounded-2xl border border-primary-100 bg-white shadow-soft hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-primary-50 text-primary-700 border border-primary-200 text-xs font-semibold rounded-xl">
                                {tip.category}
                              </Badge>

                              {isAdminDraft && (
                                <Badge className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold rounded-xl">
                                  ⚡ CREATED BY ADMIN
                                </Badge>
                              )}

                              {isPending && (
                                <Badge className="bg-amber-50 text-amber-800 border border-amber-300 text-xs font-semibold rounded-xl">
                                  ⏳ Awaiting Authority Approval
                                </Badge>
                              )}

                              {isApproved && (
                                <Badge className="bg-secondary-50 text-secondary-700 border border-secondary-300 text-xs font-semibold rounded-xl">
                                  ✓ Approved & Broadcasted
                                </Badge>
                              )}

                              {tip.status === 'REJECTED' && (
                                <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs font-semibold rounded-xl">
                                  ✗ Rejected
                                </Badge>
                              )}

                              <span className="text-xs text-muted-foreground">
                                Target: <strong className="text-slate-700">{tip.targetAudience || 'General Public'}</strong>
                              </span>
                            </div>

                            <CardTitle className="text-lg text-slate-900 mt-1">
                              {tip.title}
                            </CardTitle>
                          </div>

                          <div className="text-xs text-muted-foreground flex items-center gap-1 sm:text-right">
                            <Users className="w-3.5 h-3.5 text-primary-500" />
                            <span>Creator: <strong>{tip.author || 'System Administrator'}</strong></span>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 pt-0">
                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                          {tip.content}
                        </p>

                        {tip.reviewerNotes && (
                          <div className="text-xs bg-primary-50/70 text-primary-900 p-3 rounded-2xl border border-primary-200">
                            <strong>Regulatory Review Note: </strong>
                            {tip.reviewerNotes}
                          </div>
                        )}

                        {/* Approval Actions for Pending Tips */}
                        {isPending && (
                          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenRejectModal(tip)}
                              className="text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-2xl hover-lift"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Reject with Reason
                            </Button>

                            <Button 
                              size="sm"
                              onClick={() => handleApproveTip(tip._id)}
                              className="bg-secondary-600 hover:bg-secondary-700 text-white text-xs rounded-2xl shadow-soft hover-lift flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve & Release to Public
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PUBLIC HEALTH CAMPAIGNS                                            */}
        {/* ========================================================================= */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            
            {/* Header & Launch Campaign Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-primary-100 shadow-soft">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  National Public Health Campaigns
                </h2>
                <p className="text-xs text-muted-foreground">
                  Broadcast nationwide health initiatives, coordinate prevention directives, and track estimated public reach
                </p>
              </div>

              <Button 
                onClick={handleOpenCreateCampaign}
                className="gradient-bg-primary text-white shadow-soft hover-lift rounded-2xl text-xs font-medium self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Lancer une Nouvelle Campagne
              </Button>
            </div>

            {/* Sub-Filters */}
            <div className="flex items-center gap-2 border-b border-primary-100 pb-3">
              <Button
                variant={campaignFilter === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCampaignFilter('ALL')}
                className={`rounded-2xl text-xs hover-lift transition-all duration-200 ${
                  campaignFilter === 'ALL' ? 'gradient-bg-primary text-white shadow-soft' : 'text-slate-600 border-primary-200 hover:bg-primary-50'
                }`}
              >
                Toutes ({campaigns.length})
              </Button>
              <Button
                variant={campaignFilter === 'ACTIVE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCampaignFilter('ACTIVE')}
                className={`rounded-2xl text-xs hover-lift transition-all duration-200 ${
                  campaignFilter === 'ACTIVE' ? 'bg-secondary-600 text-white shadow-soft' : 'text-slate-600 border-primary-200 hover:bg-primary-50'
                }`}
              >
                En cours ({campaignStats.activeCount})
              </Button>
              <Button
                variant={campaignFilter === 'SCHEDULED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCampaignFilter('SCHEDULED')}
                className={`rounded-2xl text-xs hover-lift transition-all duration-200 ${
                  campaignFilter === 'SCHEDULED' ? 'bg-primary-600 text-white shadow-soft' : 'text-slate-600 border-primary-200 hover:bg-primary-50'
                }`}
              >
                Planifiées ({campaignStats.scheduledCount})
              </Button>
            </div>

            {/* Campaigns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredCampaigns.map((camp: any) => {
                const isActive = camp.status === 'ACTIVE';
                const daysLeft = calculateDaysRemaining(camp.endDate);
                const rawRegions = Array.isArray(camp.targetRegions) ? camp.targetRegions : [];
                const cleanRegions = rawRegions.filter((r: string) => !r.includes('(National)'));
                const isNational = rawRegions.some((r: string) => r.includes('(National)')) || cleanRegions.length === CAMEROON_REGIONS.length;

                return (
                  <Card key={camp._id} className="rounded-2xl border border-primary-100 bg-white shadow-soft hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={isActive ? 'bg-secondary-600 text-white rounded-xl' : 'bg-slate-600 text-white rounded-xl'}>
                              {isActive ? '● EN COURS' : camp.status}
                            </Badge>
                            {camp.priority === 'URGENT' && isActive && (
                              <Badge className="bg-red-500 text-white rounded-xl text-[10px] font-bold animate-pulse">
                                URGENT
                              </Badge>
                            )}
                            <Badge variant="outline" className="border-primary-200 text-primary-700 bg-primary-50/50 rounded-xl text-xs">
                              {camp.theme?.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <CardTitle className="text-base text-slate-900 leading-snug mt-1">
                            {camp.title}
                          </CardTitle>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditCampaign(camp)}
                            className="text-xs rounded-2xl border-primary-200 hover:bg-primary-50 text-slate-700 hover-lift shadow-sm h-8 px-2.5"
                            title="Modifier cette campagne"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1 text-primary-600" />
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleCampaignStatus(camp._id, camp.status)}
                            className="text-xs rounded-2xl border-primary-200 hover:bg-primary-50 text-primary-700 hover-lift shadow-sm h-8 px-2.5"
                          >
                            {isActive ? 'Conclure' : 'Activer'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCampaign(camp._id, camp.title)}
                            className="text-xs rounded-2xl border-red-200 hover:bg-red-50 text-red-600 hover-lift shadow-sm h-8 w-8 p-0"
                            title="Supprimer la campagne"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      {/* Period & Remaining Days Banner */}
                      <div className="flex items-center justify-between flex-wrap gap-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-2.5 rounded-2xl border border-emerald-200 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-900 font-medium">
                          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Période: <strong>{formatPeriodDate(camp.startDate)}</strong> — <strong>{formatPeriodDate(camp.endDate)}</strong></span>
                        </div>
                        {isActive && daysLeft !== null && (
                          <Badge className="bg-amber-500 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded-xl shadow-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {daysLeft} j restants
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {camp.description}
                      </p>

                      {camp.objectives && (
                        <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-700">
                          <strong className="text-slate-900 font-semibold block mb-0.5">Objectifs prioritaires:</strong>
                          {camp.objectives}
                        </div>
                      )}

                      {/* Campaign Stats Bar */}
                      <div className="grid grid-cols-2 gap-2 bg-primary-50/50 p-3 rounded-2xl border border-primary-100 text-xs">
                        <div>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-primary-500" />
                            Régions concernées:
                          </span>
                          <p className="font-semibold text-slate-900 truncate mt-0.5" title={rawRegions.join(', ')}>
                            {isNational ? 'Toutes les 10 régions (National)' : (cleanRegions.join(', ') || 'National')}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3 text-primary-500" />
                            Portée Citoyenne:
                          </span>
                          <p className="font-semibold text-secondary-600 mt-0.5">
                            {camp.estimatedReach?.toLocaleString() || '50,000'} citoyens
                          </p>
                        </div>
                      </div>

                      {/* Directives & Consignes de Prévention (Citoyens) */}
                      {((camp.preventionDirectives && camp.preventionDirectives.length > 0) || (camp.keyMessages && camp.keyMessages.length > 0)) && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Directives & Consignes de Prévention (Citoyens):
                          </p>
                          <ul className="space-y-1">
                            {(camp.preventionDirectives && camp.preventionDirectives.length > 0 ? camp.preventionDirectives : camp.keyMessages).map((msg: string, i: number) => (
                              <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5 bg-emerald-50/30 p-1.5 rounded-lg border border-emerald-100/60">
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] mt-0.5">
                                  {i + 1}
                                </span>
                                <span>{msg}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Consignes & Directives Pharmacies */}
                      {camp.pharmacyDirectives && camp.pharmacyDirectives.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-cyan-900 flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5 text-cyan-600" />
                            Consignes & Protocoles Officines Partenaires:
                          </p>
                          <ul className="space-y-1">
                            {camp.pharmacyDirectives.map((msg: string, i: number) => (
                              <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5 bg-cyan-50/40 p-1.5 rounded-lg border border-cyan-100">
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 font-bold text-[10px] mt-0.5">
                                  {i + 1}
                                </span>
                                <span>{msg}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="pt-2 border-t border-primary-100 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-primary-400" />
                          Début: {formatPeriodDate(camp.startDate)}
                        </span>
                        <span>Partenaire: <strong className="text-slate-700">{camp.budgetOrPartner || 'MINSANTÉ Cameroun'}</strong></span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: BIOEQUIVALENCE & BATCH RECALLS                                     */}
        {/* ========================================================================= */}
        {activeTab === 'regulation' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-primary-100 shadow-soft">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Generic Bioequivalence Certification & Recall Vigilance
                </h2>
                <p className="text-xs text-muted-foreground">
                  Supervise certified generic substitutes and lock quarantined batches across all community pharmacies
                </p>
              </div>

              <Button 
                onClick={() => setIsRecallModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-soft hover-lift flex items-center gap-2 text-xs font-medium self-start sm:self-auto"
              >
                <AlertTriangle className="w-4 h-4" />
                Trigger Emergency Batch Recall
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Bioequivalence List */}
              <Card className="rounded-2xl border border-primary-100 bg-white shadow-soft">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-primary-600" />
                    Certified Bioequivalent Generic Pairings
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Officially homologated by the National Pharmaceutical Committee
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {equivalences.map((eq: any) => (
                    <div key={eq._id} className="p-3.5 rounded-2xl border border-primary-100 bg-primary-50/30 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{eq.referenceMedicineName}</span>
                        <Badge className="bg-secondary-50 text-secondary-700 border border-secondary-200 text-[11px] rounded-xl">
                          Ratio {eq.bioequivalenceRatio}%
                        </Badge>
                      </div>
                      <p className="text-slate-600">Generic: <strong className="text-slate-900">{eq.genericMedicineName}</strong></p>
                      <div className="flex items-center justify-between text-muted-foreground pt-1.5 border-t border-primary-100/60">
                        <span>Certification: {eq.minsanteCertificationNumber || 'Certified MINSANTÉ'}</span>
                        <span className="text-secondary-600 font-semibold">Patient Savings: -{eq.estimatedPatientSavingsPercent || 40}%</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Active Recalls List */}
              <Card className="rounded-2xl border border-primary-100 bg-white shadow-soft">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Quarantined Batches Under National Lock
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Instant electronic freeze enforced across all registered pharmacies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {recalls.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      No batch recalls currently active. National supply chain is fully compliant.
                    </div>
                  ) : (
                    recalls.map((rec: any) => (
                      <div key={rec._id} className="p-3.5 rounded-2xl border border-red-200 bg-red-50/40 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-red-900">Batch: {rec.batchNumber}</span>
                          <Badge className="bg-red-500 text-white text-[10px] rounded-xl">LOCKED</Badge>
                        </div>
                        <p className="text-slate-800 font-medium">{rec.medicineName}</p>
                        <p className="text-slate-600 text-[11px]">{rec.reason}</p>
                        <div className="flex items-center justify-between text-muted-foreground pt-1.5 border-t border-red-100 text-[11px]">
                          <span>Quarantined Units: <strong className="text-red-700">{rec.totalUnitsQuarantined || 0}</strong></span>
                          <span>Issued: {new Date(rec.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

      </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: AI SURVEILLANCE & DRUG SEARCH SPIKE EXPLANATION                    */}
      {/* ========================================================================= */}
      <Dialog open={isAiExplanationOpen} onOpenChange={setIsAiExplanationOpen}>
        <DialogContent className="max-w-2xl rounded-2xl bg-white border border-primary-100 shadow-soft">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <BrainCircuit className="w-5 h-5 text-primary-600" />
              How MediConnect's AI Drug-Search Surveillance Engine Works
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Scientific methodology for predictive syndromic surveillance based on community drug queries
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
            <div className="p-4 rounded-2xl bg-primary-50/60 border border-primary-100 space-y-1.5">
              <h4 className="font-bold text-primary-900 flex items-center gap-1.5 text-sm">
                <Search className="w-4 h-4 text-primary-600" />
                1. Spatial Ingestion of Patient & Pharmacy Drug Searches
              </h4>
              <p>
                Every time users or healthcare providers query medicines on MediConnect (via Web, Mobile app, or USSD 2G), the system securely geocodes the request to the district level (e.g., Douala IV Bonabéri, Yaoundé VI Biyem-Assi) without recording personally identifiable information.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1.5">
              <h4 className="font-bold text-blue-900 flex items-center gap-1.5 text-sm">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                2. Statistical Anomaly & Baseline Deviation Engine
              </h4>
              <p>
                The system maintains a rolling 30-day statistical baseline (historical mean μ and standard deviation σ) for every drug category in each district. When current search volume \(S\) exceeds the baseline \(B\):
              </p>
              <div className="bg-white p-2.5 rounded-xl font-mono text-[11px] text-blue-900 border border-blue-200 shadow-sm">
                Anomaly Percentage = ((Search Volume - Baseline Volume) / Baseline Volume) * 100
              </div>
              <p>
                Thresholds: <strong>&gt;50%</strong> triggers an <em>ELEVATED</em> signal; <strong>&gt;200%</strong> triggers an immediate <em>OUTBREAK WARNING</em>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-secondary-50/60 border border-secondary-100 space-y-1.5">
              <h4 className="font-bold text-secondary-900 flex items-center gap-1.5 text-sm">
                <Database className="w-4 h-4 text-secondary-600" />
                3. Drug-to-Disease ATC AI Correlation
              </h4>
              <p>
                The engine correlates specific therapeutic classes (ATC codes) to ICD-11 epidemic pathogen groups:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li><strong>Artemether / Lumefantrine (Coartem, Artefan)</strong> &rarr; Malaria Outbreak Warning</li>
                <li><strong>Oral Rehydration Salts (ORS) + Aquatabs + Zinc</strong> &rarr; Cholera / Acute Diarrheal Cluster</li>
                <li><strong>Vitamin A + Paracetamol syrup + Amoxicillin</strong> &rarr; Measles / Respiratory Outbreak</li>
                <li><strong>Ciprofloxacin + Ceftriaxone</strong> &rarr; Enteric Typhoid Fever Surge</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1.5">
              <h4 className="font-bold text-purple-900 flex items-center gap-1.5 text-sm">
                <Globe2 className="w-4 h-4 text-purple-600" />
                4. Automated DHIS2 Ingestion & Rapid Intervention
              </h4>
              <p>
                The output is formatted directly into WHO & MINSANTÉ DHIS2 DataValueSets (with standardized <code>dataElement</code>, <code>period</code>, and <code>orgUnit</code>), allowing national epidemiologists to dispatch buffer stocks to sentinel pharmacies 7 to 10 days before hospital admission spikes.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setIsAiExplanationOpen(false)}
              className="gradient-bg-primary text-white rounded-2xl text-xs hover-lift shadow-soft"
            >
              Close Explanation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: PREVIEW DHIS2 JSON PAYLOAD                                         */}
      {/* ========================================================================= */}
      <Dialog open={isDhis2PreviewOpen} onOpenChange={setIsDhis2PreviewOpen}>
        <DialogContent className="max-w-3xl rounded-2xl bg-white border border-primary-100 shadow-soft">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Globe2 className="w-5 h-5 text-primary-600" />
              Preview DHIS2 DataValueSet Packet (MINSANTÉ / WHO Standard)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Standardized JSON structure ready for REST API ingestion by Cameroon's national DHIS2 instance
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-xs max-h-96 overflow-y-auto">
            <pre>{JSON.stringify(dhis2PreviewData, null, 2)}</pre>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <span className="text-xs text-muted-foreground">
              {dhis2PreviewData?.dataValues?.length || 0} syndromic data values included
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDhis2PreviewOpen(false)}
                className="rounded-2xl text-xs border-primary-200 hover:bg-primary-50"
              >
                Close
              </Button>
              <Button 
                onClick={handleExportDhis2Json}
                className="gradient-bg-primary text-white rounded-2xl text-xs flex items-center gap-1.5 hover-lift shadow-soft"
              >
                <Download className="w-3.5 h-3.5" />
                Download JSON File
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: CREATE OFFICIAL HEALTH TIP                                         */}
      {/* ========================================================================= */}
      <Dialog open={isCreateTipOpen} onOpenChange={setIsCreateTipOpen}>
        <DialogContent className="max-w-xl rounded-2xl bg-white border border-primary-100 shadow-soft">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Plus className="w-5 h-5 text-primary-600" />
              Draft Official Public Health Advisory
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This advisory will bear the official seal of the National Health Authority and be released immediately to all users.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOfficialTip} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Advisory Title</Label>
              <Input 
                required
                value={newTipForm.title}
                onChange={(e) => setNewTipForm({ ...newTipForm, title: e.target.value })}
                placeholder="e.g., Safe Malaria Prevention Guidelines During Rainy Season"
                className="rounded-2xl text-sm border-primary-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700">Health Category</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomTipCategory(!isCustomTipCategory);
                      if (!isCustomTipCategory) setCustomTipCategoryInput('');
                    }}
                    className="text-[10px] text-primary-600 hover:underline font-medium"
                  >
                    {isCustomTipCategory ? 'Standard list' : '+ Other category'}
                  </button>
                </div>

                {!isCustomTipCategory ? (
                  <select 
                    value={newTipForm.category}
                    onChange={(e) => setNewTipForm({ ...newTipForm, category: e.target.value })}
                    className="w-full text-xs border border-primary-200 rounded-2xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                  >
                    {availableTipCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                ) : (
                  <Input 
                    required
                    value={customTipCategoryInput}
                    onChange={(e) => setCustomTipCategoryInput(e.target.value)}
                    placeholder="Enter custom category name..."
                    className="rounded-2xl text-xs border-primary-200"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Target Audience</Label>
                <select 
                  value={newTipForm.targetAudience}
                  onChange={(e) => setNewTipForm({ ...newTipForm, targetAudience: e.target.value })}
                  className="w-full text-xs border border-primary-200 rounded-2xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                >
                  <option value="General Public">General Public</option>
                  <option value="Parents, Mothers of Young Children">Parents & Mothers of Young Children</option>
                  <option value="Pregnant Mothers">Pregnant Mothers</option>
                  <option value="Elderly Population">Elderly Population</option>
                  <option value="Chronic Illness Patients">Chronic Illness Patients</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Advisory Content</Label>
              <Textarea 
                required
                rows={5}
                value={newTipForm.content}
                onChange={(e) => setNewTipForm({ ...newTipForm, content: e.target.value })}
                placeholder="Provide clear, evidence-based recommendations, dosage warnings, and prompt medical reflexes..."
                className="rounded-2xl text-sm border-primary-200"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateTipOpen(false)}
                className="rounded-2xl text-xs border-primary-200 hover:bg-primary-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="gradient-bg-primary text-white rounded-2xl text-xs hover-lift shadow-soft"
              >
                Publish Immediately
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: REJECT HEALTH TIP                                                  */}
      {/* ========================================================================= */}
      <Dialog open={isRejectTipOpen} onOpenChange={setIsRejectTipOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white border border-primary-100 shadow-soft">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <XCircle className="w-5 h-5 text-red-600" />
              Reject Draft Health Tip
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide institutional feedback so the creator (Admin or Practitioner) can revise it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-xs text-slate-600 font-medium">
              Tip Title: <strong className="text-slate-900">{selectedTipToReject?.title}</strong>
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Official Regulatory Rejection Reason</Label>
              <Textarea 
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify the therapeutic inaccuracy, non-compliance, or needed corrections..."
                className="rounded-2xl text-sm border-primary-200"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsRejectTipOpen(false)}
              className="rounded-2xl text-xs border-primary-200 hover:bg-primary-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmRejectTip}
              className="bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs hover-lift shadow-soft"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT PUBLIC HEALTH CAMPAIGN                               */}
      {/* ========================================================================= */}
      <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-primary-100 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-lg">
              <Megaphone className="w-5 h-5 text-primary-600" />
              {editingCampaignId ? 'Modifier la Campagne de Santé Publique' : 'Lancer une Nouvelle Campagne Nationale de Santé Publique'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingCampaignId 
                ? 'Mettez à jour les dates de validité, régions cibles, directives de prévention et paramètres de la campagne.'
                : 'Déployez une initiative nationale synchronisée avec toutes les officines et canaux citoyens du Cameroun.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCampaign} className="space-y-5 mt-2">
            {/* Title & Theme */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Titre Officiel de la Campagne *</Label>
                <Input 
                  required
                  value={campaignFormData.title}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, title: e.target.value })}
                  placeholder="ex: Campagne Nationale de Distribution de Moustiquaires Imprégnées (MILDA 2026)"
                  className="rounded-2xl text-sm border-primary-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Thématique Sanitaire</Label>
                <select 
                  value={campaignFormData.theme}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, theme: e.target.value })}
                  className="w-full text-xs border border-primary-200 rounded-2xl px-3 py-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                >
                  <option value="MALARIA_PREVENTION">Paludisme & MILDA</option>
                  <option value="CHOLERA_RESPONSE">Riposte Choléra & Eau Salubre</option>
                  <option value="COUNTERFEIT_DRUGS_AWARENESS">Lutte Contre Médicaments Faux / Rue</option>
                  <option value="VACCINATION">Programme Élargi de Vaccination (PEV)</option>
                  <option value="HYGIENE_SANITATION">Hygiène Publique & Assainissement</option>
                  <option value="MATERNAL_CHILD_HEALTH">Santé Mère-Enfant & CPN</option>
                  <option value="CHRONIC_DISEASE_DIABETES_HYPERTENSION">Diabète & Hypertension</option>
                  <option value="GENERAL_PREVENTION">Sensibilisation Générale</option>
                </select>
              </div>
            </div>

            {/* PERIOD: Start Date & End Date */}
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  Période d'Exécution & Validité de la Campagne *
                </Label>
                {campaignFormData.startDate && campaignFormData.endDate && (
                  <Badge className="bg-emerald-700 text-white text-[11px] font-mono font-medium rounded-xl">
                    Durée: {Math.max(1, Math.ceil((new Date(campaignFormData.endDate).getTime() - new Date(campaignFormData.startDate).getTime()) / (1000 * 60 * 60 * 24)))} jours
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-900 block">Date de début de la campagne *</span>
                  <Input 
                    type="date"
                    required
                    value={campaignFormData.startDate}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, startDate: e.target.value })}
                    className="rounded-xl text-xs border-emerald-300 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-900 block">Date de fin / clôture officielle *</span>
                  <Input 
                    type="date"
                    required
                    value={campaignFormData.endDate}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, endDate: e.target.value })}
                    className="rounded-xl text-xs border-emerald-300 bg-white"
                  />
                </div>
              </div>
              <p className="text-[11px] text-emerald-800">
                • Les campagnes actives s'affichent automatiquement sur les portails des patients et officines avec décompte des jours restants pendant toute cette période.
              </p>
            </div>

            {/* TARGET REGIONS CHECKLIST */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    Régions Concernées (Cameroun) *
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Cochez les régions où s'applique la campagne ({campaignFormData.targetRegions.length} / {CAMEROON_REGIONS.length} sélectionnées)
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleToggleAllRegions}
                  className="text-xs rounded-xl border-primary-200 hover:bg-primary-50 text-primary-700 h-7 px-3 font-medium"
                >
                  {campaignFormData.targetRegions.length === CAMEROON_REGIONS.length 
                    ? 'Tout désélectionner' 
                    : 'Toutes les 10 régions (National)'}
                </Button>
              </div>

              {/* 10 Regions Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {CAMEROON_REGIONS.map((region) => {
                  const isChecked = campaignFormData.targetRegions.includes(region);
                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={() => handleToggleRegion(region)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs border transition-all text-left ${
                        isChecked 
                          ? 'bg-primary-50 border-primary-400 text-primary-900 font-semibold shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-primary-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{region}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Context & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Description & Contexte Sanitaire *</Label>
                <Textarea 
                  required
                  rows={3}
                  value={campaignFormData.description}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, description: e.target.value })}
                  placeholder="Contexte épidémiologique, importance de l'initiative, directives générales..."
                  className="rounded-2xl text-xs border-primary-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Objectifs Stratégiques Prioritaires</Label>
                <Textarea 
                  rows={3}
                  value={campaignFormData.objectives}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, objectives: e.target.value })}
                  placeholder="ex: Réduire le taux d'incidence du paludisme de 40%, distribuer 3 millions de moustiquaires..."
                  className="rounded-2xl text-xs border-primary-200"
                />
              </div>
            </div>

            {/* DIRECTIVES ET CONSIGNES DE PREVENTION */}
            <div className="space-y-3">
              <div className="space-y-1.5 bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-200">
                <Label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Directives & Consignes de Prévention pour les Citoyens (1 directive par ligne)
                </Label>
                <Textarea 
                  rows={3}
                  value={campaignFormData.preventionDirectives}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, preventionDirectives: e.target.value })}
                  placeholder={"• Dormir sous moustiquaire imprégnée d'insecticide (MILDA) chaque nuit\n• Détruire tous les gîtes larvaires et eaux stagnantes autour du domicile\n• En cas de fièvre ou de frissons, consulter immédiatement en pharmacie"}
                  className="rounded-xl text-xs border-emerald-200 bg-white"
                />
                <p className="text-[11px] text-emerald-800">
                  Ces directives sont affichées avec des coches officielles sur le tableau de bord patient et dans les détails de la campagne.
                </p>
              </div>

              <div className="space-y-1.5 bg-cyan-50/40 p-3.5 rounded-2xl border border-cyan-200">
                <Label className="text-xs font-bold text-cyan-950 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-cyan-600" />
                  Directives d'Action Spécifiques pour les Pharmacies & Centres de Santé (1 consigne par ligne)
                </Label>
                <Textarea 
                  rows={2}
                  value={campaignFormData.pharmacyDirectives}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, pharmacyDirectives: e.target.value })}
                  placeholder={"• Distribution gratuite des kits homologués contre présentation de pièce d'identité\n• Notifier sans délai les ruptures éventuelles via l'onglet Autorité Sanitaire\n• Renseigner le registre national des bénéficiaires"}
                  className="rounded-xl text-xs border-cyan-200 bg-white"
                />
              </div>
            </div>

            {/* Logistics & Reach */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Partenaire(s) / Financement</Label>
                <Input 
                  value={campaignFormData.budgetOrPartner}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, budgetOrPartner: e.target.value })}
                  placeholder="ex: MINSANTÉ / OMS / Fonds Mondial"
                  className="rounded-2xl text-xs border-primary-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Population Cible Estimée</Label>
                <Input 
                  type="number"
                  value={campaignFormData.estimatedReach}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, estimatedReach: Number(e.target.value) })}
                  className="rounded-2xl text-xs border-primary-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Niveau de Priorité</Label>
                <select 
                  value={campaignFormData.priority}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, priority: e.target.value })}
                  className="w-full text-xs border border-primary-200 rounded-2xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                >
                  <option value="HIGH">Priorité Haute (Standard National)</option>
                  <option value="URGENT">URGENT (Alerte Épidémique Majeure)</option>
                  <option value="STANDARD">Standard</option>
                </select>
              </div>
            </div>

            {!editingCampaignId && (
              <div className="flex items-center gap-2 p-3 bg-primary-50/70 rounded-2xl border border-primary-200">
                <input 
                  type="checkbox"
                  id="broadcastAlert"
                  checked={campaignFormData.broadcastAlert}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, broadcastAlert: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                />
                <label htmlFor="broadcastAlert" className="text-xs text-primary-900 font-medium cursor-pointer">
                  Diffuser une alerte sanitaire et notification in-app immédiate à tous les patients et pharmacies inscrits
                </label>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateCampaignOpen(false)}
                className="rounded-2xl text-xs border-primary-200 hover:bg-primary-50"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="gradient-bg-primary text-white rounded-2xl text-xs hover-lift shadow-soft px-5 font-semibold"
              >
                {editingCampaignId ? 'Enregistrer les modifications' : 'Diffuser et lancer la campagne'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: TRIGGER EMERGENCY BATCH RECALL                                     */}
      {/* ========================================================================= */}
      <Dialog open={isRecallModalOpen} onOpenChange={setIsRecallModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl bg-white border border-primary-100 shadow-soft">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Trigger Emergency Batch Recall
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Immediate regulatory action: locks stock in every pharmacy point of sale across the country
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTriggerRecall} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Affected Batch Number</Label>
              <Input 
                required
                value={recallForm.batchNumber}
                onChange={(e) => setRecallForm({ ...recallForm, batchNumber: e.target.value })}
                placeholder="e.g., LOT-AMOX-2024-09"
                className="rounded-2xl text-sm border-primary-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Medicine Name</Label>
              <Input 
                required
                value={recallForm.medicineName}
                onChange={(e) => setRecallForm({ ...recallForm, medicineName: e.target.value })}
                placeholder="e.g., Amoxicillin 500mg Capsule"
                className="rounded-2xl text-sm border-primary-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Regulatory Hazard Justification</Label>
              <Textarea 
                required
                rows={3}
                value={recallForm.reason}
                onChange={(e) => setRecallForm({ ...recallForm, reason: e.target.value })}
                className="rounded-2xl text-sm border-primary-200"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsRecallModalOpen(false)}
                className="rounded-2xl text-xs border-primary-200 hover:bg-primary-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs hover-lift shadow-soft"
              >
                Confirm & Lock All Stocks
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
