import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  Coins, 
  Package,
  Download, 
  RefreshCw,
  Loader2,
  Database,
  ShieldCheck,
  Building2,
  HeartPulse,
  AlertTriangle,
  Clock,
  Sparkles,
  Camera,
  CheckCircle2,
  FileSpreadsheet,
  Eye,
  Trash2,
  MapPin,
  Pill,
  Radio,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Chart color palette for healthcare visualization
const VIBRANT_COLORS = [
  '#0284c7', // Primary Ocean Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

interface RegionalData {
  region: string;
  pharmacies: number;
  patients: number;
  totalUsers: number;
  onDutyPharmacies: number;
  activeCampaigns: number;
}

interface CategoryData {
  category: string;
  medicineCount: number;
  stockUnits: number;
  totalValueXaf: number;
  percentage: number;
}

interface UserGrowthData {
  month: string;
  patients: number;
  pharmacies: number;
  total: number;
}

interface ActivityData {
  day: string;
  searches: number;
  messages: number;
  audits: number;
  registrations: number;
}

interface SystemAnalyticsSummary {
  totalUsers: number;
  patients: number;
  pharmacies: number;
  onDutyPharmacies: number;
  healthAuthorities: number;
  admins: number;
  activeUsers: number;
  masterMedicines: number;
  inventoryBatches: number;
  totalStockUnits: number;
  totalStockValueXaf: number;
  avgMedicinePriceXaf: number;
  lowStockAlerts: number;
  outOfStockCount: number;
  publicHealthCampaigns: number;
  activeCampaigns: number;
  publicHealthAlerts: number;
  epidemiologicalSignals: number;
  batchRecalls: number;
  healthTipsTotal: number;
  healthTipsApproved: number;
  healthTipsPending: number;
  healthTipsRejected: number;
  totalPrescriptions: number;
  activePillReminders: number;
  totalMessages: number;
  totalAuditLogs: number;
  last24hAuditLogs: number;
}

interface SystemHealth {
  dbStatus: string;
  dbLatencyMs: number;
  uptimeSeconds: number;
  memoryUsageMb: number;
  errorRatePercent: number;
  environment: string;
}

interface AnalyticsSnapshotItem {
  _id: string;
  snapshotType: string;
  capturedByName: string;
  period: string;
  summary: SystemAnalyticsSummary;
  systemHealth: SystemHealth;
  notes: string;
  createdAt: string;
}

interface AnalyticsApiResponse {
  summary: SystemAnalyticsSummary;
  regionalDistribution: RegionalData[];
  categoryDistribution: CategoryData[];
  userGrowthTrend: UserGrowthData[];
  activityTrend: ActivityData[];
  systemHealth: SystemHealth;
  lastSavedSnapshot?: {
    id: string;
    createdAt: string;
    capturedByName: string;
    snapshotType: string;
  };
  totalSavedSnapshots: number;
}

export function SystemAnalytics() {
  const [timeRange, setTimeRange] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [analyticsData, setAnalyticsData] = useState<AnalyticsApiResponse | null>(null);
  const [snapshots, setSnapshots] = useState<AnalyticsSnapshotItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Snapshot modal states
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [snapshotNotes, setSnapshotNotes] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState<AnalyticsSnapshotItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Authentication token retrieval
  const getAuthToken = useCallback((): string | null => {
    const adminAuth = localStorage.getItem('mediconnect_admin_auth');
    if (adminAuth) {
      try {
        const parsed = JSON.parse(adminAuth);
        if (parsed?.token) return parsed.token;
      } catch {}
    }

    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed?.token) return parsed.token;
        if (parsed?.data?.token) return parsed.data.token;
        if (parsed?.user?.data?.token) return parsed.user.data.token;
      } catch {}
    }

    const sessionAdmin = sessionStorage.getItem('mediconnect_admin_auth');
    if (sessionAdmin) {
      try {
        const parsed = JSON.parse(sessionAdmin);
        if (parsed?.token) return parsed.token;
      } catch {}
    }

    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }, []);

  // Fetch live system analytics from backend
  const fetchLiveAnalytics = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error('Authentication required. Please log in as an administrator.');
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const res = await fetch(`${API_BASE}/analytics/overview?period=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        let errorMsg = `Server returned HTTP ${res.status}`;
        if (contentType && contentType.includes('application/json')) {
          const errData = await res.json().catch(() => ({}));
          errorMsg = errData.message || errorMsg;
        }
        throw new Error(errorMsg);
      }

      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Unexpected non-JSON response from server (${res.status}). Ensure backend is running.`);
      }

      const responseJson = await res.json();
      if (responseJson.success && responseJson.data) {
        setAnalyticsData(responseJson.data);
      }
    } catch (err: any) {
      console.error('Error loading MediConnect analytics:', err);
      toast.error(`Analytics sync error: ${err.message}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getAuthToken, timeRange]);

  // Fetch saved snapshots history from MongoDB Atlas
  const fetchSnapshotsHistory = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/analytics/history?limit=25`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const resJson = await res.json();
          if (resJson.success && resJson.data?.snapshots) {
            setSnapshots(resJson.data.snapshots);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching snapshot history:', err);
    }
  }, [getAuthToken]);

  // Initial load
  useEffect(() => {
    fetchLiveAnalytics();
    fetchSnapshotsHistory();
  }, [fetchLiveAnalytics, fetchSnapshotsHistory]);

  // Handle explicit snapshot persistence to database
  const handleSaveSnapshot = async () => {
    setIsSavingSnapshot(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error('Authentication required.');
        setIsSavingSnapshot(false);
        return;
      }

      const res = await fetch(`${API_BASE}/analytics/snapshot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          period: timeRange,
          notes: snapshotNotes.trim() || 'Admin-triggered verified platform snapshot.',
          snapshotType: 'MANUAL_ADMIN_SNAPSHOT'
        })
      });

      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        let msg = `Failed to save snapshot (HTTP ${res.status})`;
        if (contentType && contentType.includes('application/json')) {
          const errJson = await res.json().catch(() => ({}));
          msg = errJson.message || msg;
        }
        throw new Error(msg);
      }

      const data = await res.json();
      toast.success('MediConnect system analytics snapshot persisted to MongoDB database!');
      setShowSaveModal(false);
      setSnapshotNotes('');

      // Refresh overview and snapshots list
      await Promise.all([fetchLiveAnalytics(true), fetchSnapshotsHistory()]);
    } catch (err: any) {
      console.error('Snapshot save error:', err);
      toast.error(`Failed to save snapshot: ${err.message}`);
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  // Handle CSV Report Export
  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error('Authentication required.');
        setIsExporting(false);
        return;
      }

      const res = await fetch(`${API_BASE}/analytics/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Export request failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mediconnect_analytics_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('MediConnect analytics CSV report downloaded successfully');
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const summary = analyticsData?.summary;
  const systemHealth = analyticsData?.systemHealth;

  // Prepare Stakeholders Pie Data
  const stakeholderPieData = [
    { name: 'Patients & Citizens', value: summary?.patients || 0, fill: '#0284c7' },
    { name: 'Licensed Pharmacies', value: summary?.pharmacies || 0, fill: '#10b981' },
    { name: 'Health Authorities (MINSANTÉ)', value: summary?.healthAuthorities || 0, fill: '#f59e0b' },
    { name: 'System Admins', value: summary?.admins || 0, fill: '#8b5cf6' }
  ].filter(d => d.value > 0);

  // Prepare Public Health Clearance Pie Data
  const healthTipsPieData = [
    { name: 'Approved & Active', value: summary?.healthTipsApproved || 0, fill: '#10b981' },
    { name: 'Pending Clearance', value: summary?.healthTipsPending || 0, fill: '#f59e0b' },
    { name: 'Rejected / Archived', value: summary?.healthTipsRejected || 0, fill: '#ef4444' }
  ].filter(d => d.value > 0);

  if (isLoading && !analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[480px] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <div className="text-center">
          <p className="font-semibold text-lg text-slate-800">Loading MediConnect Live Analytics...</p>
          <p className="text-sm text-slate-500">Aggregating telemetry from MongoDB Atlas clusters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Status & Database Snapshot Persistence */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-5 shadow-lg border border-slate-700">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs px-2.5 py-0.5 font-medium">
                Live MongoDB Atlas Telemetry
              </Badge>
              <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs px-2.5 py-0.5 font-medium">
                MediConnect Cameroon
              </Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              System Telemetry & Platform Analytics
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Real-time monitoring across 10 Cameroonian regions, licensed dispensary inventory valuation, MINSANTÉ clearance pipeline, and database-persisted telemetry snapshots.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLiveAnalytics(true)}
              disabled={isRefreshing}
              className="bg-slate-800/80 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Live Refresh'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSaveModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition-all"
            >
              <Camera className="w-3.5 h-3.5 mr-1.5" />
              Save Snapshot to DB
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleExportReport}
              disabled={isExporting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm"
            >
              <Download className={`w-3.5 h-3.5 mr-1.5 ${isExporting ? 'animate-spin' : ''}`} />
              {isExporting ? 'Exporting...' : 'Export Report'}
            </Button>
          </div>
        </div>

        {/* Database Snapshot Info Footer */}
        {analyticsData?.lastSavedSnapshot && (
          <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Last Database Snapshot: <strong className="text-slate-200">{new Date(analyticsData.lastSavedSnapshot.createdAt).toLocaleString()}</strong> by <span className="text-emerald-300">{analyticsData.lastSavedSnapshot.capturedByName}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>Snapshots in MongoDB Atlas: <strong className="text-slate-200">{analyticsData.totalSavedSnapshots}</strong></span>
              <span className="hidden sm:inline">•</span>
              <span className="text-slate-300">Cluster Status: <strong className="text-emerald-400 font-medium">{systemHealth?.dbStatus}</strong> ({systemHealth?.dbLatencyMs}ms)</span>
            </div>
          </div>
        )}
      </div>

      {/* Strategic MediConnect KPI Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users & Stakeholders */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform Citizens & Users</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-900">{summary?.totalUsers || 0}</span>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                    {summary?.activeUsers || 0} Active
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  <strong className="text-slate-700">{summary?.patients || 0}</strong> Citizens • <strong className="text-slate-700">{summary?.pharmacies || 0}</strong> Pharmacies ({summary?.onDutyPharmacies || 0} de Garde)
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-muted-foreground">
              <span>Health Authorities:</span>
              <span className="font-semibold text-slate-700">{summary?.healthAuthorities || 0} MINSANTÉ/ONPC</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pharmaceutical Stock Valuation */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">National Stock Valuation</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {(summary?.totalStockValueXaf || 0).toLocaleString()} <span className="text-sm font-semibold text-slate-600">FCFA</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  <strong className="text-slate-700">{(summary?.totalStockUnits || 0).toLocaleString()}</strong> units in registered dispensaries
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <Coins className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-muted-foreground">
              <span>Master Catalogue:</span>
              <span className="font-semibold text-slate-700">{summary?.masterMedicines || 0} Approved Drugs</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Public Health & MINSANTÉ Vigilance */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Public Health Vigilance</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-900">{summary?.activeCampaigns || 0}</span>
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                    {summary?.epidemiologicalSignals || 0} Signals
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  <strong className="text-emerald-600">{summary?.healthTipsApproved || 0}</strong> Cleared Tips • <strong className="text-amber-600">{summary?.healthTipsPending || 0}</strong> Pending
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <HeartPulse className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-muted-foreground">
              <span>LNSPM Batch Recalls:</span>
              <span className="font-semibold text-red-600">{summary?.batchRecalls || 0} Quarantined</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Audit & Security Trail */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Security & Audit Events</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-900">{summary?.totalAuditLogs || 0}</span>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                    +{summary?.last24hAuditLogs || 0} 24h
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  <strong className="text-slate-700">{summary?.totalPrescriptions || 0}</strong> Rx • <strong className="text-slate-700">{summary?.totalMessages || 0}</strong> Encrypted Msgs
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-muted-foreground">
              <span>Server Telemetry:</span>
              <span className="font-semibold text-emerald-600">{systemHealth?.dbLatencyMs || 0}ms Latency</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full sm:w-auto h-auto p-1 bg-slate-100/80 rounded-lg">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-1.5 px-3">Overview</TabsTrigger>
            <TabsTrigger value="regions" className="text-xs sm:text-sm py-1.5 px-3">Cameroon Regions</TabsTrigger>
            <TabsTrigger value="pharmaceuticals" className="text-xs sm:text-sm py-1.5 px-3">Drug Supplies</TabsTrigger>
            <TabsTrigger value="governance" className="text-xs sm:text-sm py-1.5 px-3">MINSANTÉ Vigilance</TabsTrigger>
            <TabsTrigger value="snapshots" className="text-xs sm:text-sm py-1.5 px-3 flex items-center gap-1.5">
              <span>DB Snapshots</span>
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-emerald-100 text-emerald-800">
                {analyticsData?.totalSavedSnapshots || snapshots.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="3months">Last 3 months</SelectItem>
                <SelectItem value="1year">Last 1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ================= TAB 1: OVERVIEW ================= */}
        <TabsContent value="overview" className="space-y-6 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Trend Area Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span>Platform Stakeholder Growth Trajectory</span>
                  <Badge variant="outline" className="text-xs font-normal">MongoDB Registrations</Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Cumulative citizens & verified community pharmacies registered on MediConnect
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData?.userGrowthTrend || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#0284c7" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                        formatter={(val: any, name: any) => [val, name === 'total' ? 'Total Users' : name === 'patients' ? 'Patients' : 'Pharmacies']}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Area type="monotone" dataKey="total" name="Total Users" stroke="#0284c7" fillOpacity={1} fill="url(#colorTotal)" />
                      <Area type="monotone" dataKey="patients" name="Patients & Citizens" stroke="#10b981" fillOpacity={1} fill="url(#colorPatients)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Activity Pattern Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span>Weekly Platform Engagement & Operations</span>
                  <Badge variant="outline" className="text-xs font-normal">Audits & Consultations</Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribution of system audits, patient-pharmacy messages, and medicine searches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData?.activityTrend || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="audits" name="System Audits" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="messages" name="Telehealth Messages" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="searches" name="Medicine Queries" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health & Hardware Telemetry Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-50/70 border-slate-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">MongoDB Atlas Status</p>
                    <p className="text-lg font-bold text-emerald-700 flex items-center gap-1.5">
                      {systemHealth?.dbStatus}
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                    </p>
                    <p className="text-[11px] text-slate-500">Cluster Latency: {systemHealth?.dbLatencyMs}ms</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50/70 border-slate-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Backend Process Uptime</p>
                    <p className="text-lg font-bold text-slate-800">
                      {formatUptime(systemHealth?.uptimeSeconds || 0)}
                    </p>
                    <p className="text-[11px] text-slate-500">Node.js Runtime Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50/70 border-slate-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 text-purple-700 rounded-lg">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Heap Memory Utilization</p>
                    <p className="text-lg font-bold text-slate-800">
                      {systemHealth?.memoryUsageMb || 0} MB
                    </p>
                    <p className="text-[11px] text-slate-500">Optimal Memory Profile</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50/70 border-slate-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Patient Adherence Trackers</p>
                    <p className="text-lg font-bold text-slate-800">
                      {summary?.activePillReminders || 0} Reminders
                    </p>
                    <p className="text-[11px] text-slate-500">{summary?.totalPrescriptions || 0} Active Prescriptions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================= TAB 2: CAMEROON REGIONAL COVERAGE ================= */}
        <TabsContent value="regions" className="space-y-6 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Regional Distribution Horizontal Bar Chart (2 cols) */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span>Territorial Coverage — 10 Regions of Cameroon</span>
                  <Badge variant="outline" className="text-xs font-normal">ONPC & MINSANTÉ Footprint</Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Number of verified community pharmacies and registered citizen users by administrative region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[360px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData?.regionalDistribution || []}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="region" type="category" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="pharmacies" name="Pharmacies" fill="#10b981" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="patients" name="Patients" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="activeCampaigns" name="Active Campaigns" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Stakeholder Breakdown Pie Chart (1 col) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Stakeholder Composition</CardTitle>
                <CardDescription className="text-xs">
                  Proportion of platform users by role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stakeholderPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stakeholderPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
                  {stakeholderPieData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-semibold text-slate-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Regional Table Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Cameroon Regional Healthcare Network Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 text-xs">
                    <TableHead className="font-semibold">Region</TableHead>
                    <TableHead className="text-center font-semibold">Community Pharmacies</TableHead>
                    <TableHead className="text-center font-semibold">Pharmacies de Garde (On Duty)</TableHead>
                    <TableHead className="text-center font-semibold">Citizens / Patients</TableHead>
                    <TableHead className="text-center font-semibold">Active MINSANTÉ Campaigns</TableHead>
                    <TableHead className="text-right font-semibold">Regional Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData?.regionalDistribution?.map((reg) => (
                    <TableRow key={reg.region} className="text-xs hover:bg-slate-50/70">
                      <TableCell className="font-medium flex items-center gap-1.5 text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {reg.region}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-slate-700">{reg.pharmacies}</TableCell>
                      <TableCell className="text-center">
                        {reg.onDutyPharmacies > 0 ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[11px]">
                            {reg.onDutyPharmacies} Active
                          </Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-slate-600">{reg.patients}</TableCell>
                      <TableCell className="text-center font-medium text-amber-700">{reg.activeCampaigns}</TableCell>
                      <TableCell className="text-right">
                        {reg.pharmacies > 0 ? (
                          <span className="text-emerald-600 font-medium">Connected Hub</span>
                        ) : (
                          <span className="text-slate-400">Expansion Zone</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= TAB 3: PHARMACEUTICAL SUPPLY & INVENTORY ================= */}
        <TabsContent value="pharmaceuticals" className="space-y-6 pt-2">
          {/* Inventory Health Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Total In-Stock Units</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {(summary?.totalStockUnits || 0).toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Across all registered dispensaries</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Total Stock Valuation</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  {(summary?.totalStockValueXaf || 0).toLocaleString()} <span className="text-xs">FCFA</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Avg Unit Price: {summary?.avgMedicinePriceXaf || 0} FCFA</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Low Stock Safety Alerts</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {summary?.lowStockAlerts || 0} Batches
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Approaching replenishment threshold</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Stockout Alerts</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {summary?.outOfStockCount || 0} Items
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Zero units remaining in stock</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Stock Distribution Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Stock Volume by Therapeutic Category</CardTitle>
                <CardDescription className="text-xs">
                  Physical units of medicines stocked across pharmacy networks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData?.categoryDistribution || []}
                      margin={{ top: 10, right: 20, left: -10, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="category" 
                        angle={-30} 
                        textAnchor="end" 
                        interval={0} 
                        height={60} 
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                      />
                      <Bar dataKey="stockUnits" name="Stock Units" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Medicine Breakdown Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">National Catalogue Categorization</CardTitle>
                <CardDescription className="text-xs">
                  Breakdown of LNSPM registered medicines and inventory valuation in FCFA
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 text-xs">
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">Catalogue Items</TableHead>
                        <TableHead className="text-center">Stock Units</TableHead>
                        <TableHead className="text-right">Valuation (FCFA)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyticsData?.categoryDistribution?.map((cat, idx) => (
                        <TableRow key={idx} className="text-xs">
                          <TableCell className="font-medium text-slate-800">{cat.category}</TableCell>
                          <TableCell className="text-center font-semibold text-slate-700">{cat.medicineCount}</TableCell>
                          <TableCell className="text-center text-slate-600">{cat.stockUnits.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium text-emerald-700">
                            {cat.totalValueXaf.toLocaleString()} FCFA
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================= TAB 4: MINSANTÉ & REGULATORY VIGILANCE ================= */}
        <TabsContent value="governance" className="space-y-6 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Tips Regulatory Clearance Funnel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span>Public Health Advisory Clearance Funnel</span>
                  <Badge variant="outline" className="text-xs font-normal">MINSANTÉ Validation</Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Status of health tips drafted by administrators and verified by health authorities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={healthTipsPieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {healthTipsPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <p className="text-[10px] text-emerald-700 font-medium">Approved & Live</p>
                    <p className="text-xl font-bold text-emerald-800">{summary?.healthTipsApproved || 0}</p>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <p className="text-[10px] text-amber-700 font-medium">Pending Clearance</p>
                    <p className="text-xl font-bold text-amber-800">{summary?.healthTipsPending || 0}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] text-slate-600 font-medium">Total Tips</p>
                    <p className="text-xl font-bold text-slate-800">{summary?.healthTipsTotal || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Public Health Alerts & Epidemic Signals */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Epidemiological Surveillance Monitor</CardTitle>
                <CardDescription className="text-xs">
                  Active disease signals and pharmacovigilance batch quarantines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-900">Epidemiological Signals Active</p>
                      <p className="text-xs text-amber-700">Disease surge anomalies flagged in Cameroonian health zones</p>
                    </div>
                  </div>
                  <span className="text-2xl font-extrabold text-amber-800">{summary?.epidemiologicalSignals || 0}</span>
                </div>

                <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-900">Active Public Health Campaigns</p>
                      <p className="text-xs text-blue-700">Multi-region vaccination and hygiene operations (MINSANTÉ/OMS)</p>
                    </div>
                  </div>
                  <span className="text-2xl font-extrabold text-blue-800">{summary?.activeCampaigns || 0}</span>
                </div>

                <div className="p-3.5 bg-red-50/80 border border-red-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 text-red-800 rounded-lg">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-900">LNSPM Batch Recalls Quarantined</p>
                      <p className="text-xs text-red-700">Counterfeit or substandard medication batches under national alert</p>
                    </div>
                  </div>
                  <span className="text-2xl font-extrabold text-red-800">{summary?.batchRecalls || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================= TAB 5: DATABASE SNAPSHOTS ================= */}
        <TabsContent value="snapshots" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>MongoDB Atlas Telemetry Snapshots</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Historical platform state records stored persistently in the database for auditing and longitudinal trend tracking
                </CardDescription>
              </div>

              <Button
                size="sm"
                onClick={() => setShowSaveModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white self-start sm:self-auto"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                Capture New Snapshot
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {snapshots.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium">No snapshots found in database yet.</p>
                  <p className="text-xs mt-1">Click "Capture New Snapshot" to save the current platform state to MongoDB Atlas.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 text-xs">
                      <TableHead>Snapshot ID & Timestamp</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Captured By</TableHead>
                      <TableHead className="text-center">Total Users</TableHead>
                      <TableHead className="text-center">Stock Units</TableHead>
                      <TableHead className="text-right">Valuation (FCFA)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshots.map((snap) => (
                      <TableRow key={snap._id} className="text-xs hover:bg-slate-50/70">
                        <TableCell>
                          <div className="font-semibold text-slate-800">
                            {new Date(snap.createdAt).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            ID: {snap._id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={`text-[10px] ${
                              snap.snapshotType === 'MANUAL_ADMIN_SNAPSHOT' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {snap.snapshotType === 'MANUAL_ADMIN_SNAPSHOT' ? 'Manual Admin' : 'Daily Automated'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {snap.capturedByName || 'MediConnect Daemon'}
                        </TableCell>
                        <TableCell className="text-center font-bold text-slate-800">
                          {snap.summary?.totalUsers || 0}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-700">
                          {(snap.summary?.totalStockUnits || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-700">
                          {(snap.summary?.totalStockValueXaf || 0).toLocaleString()} FCFA
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSnapshot(snap);
                              setShowDetailModal(true);
                            }}
                            className="h-7 px-2 text-slate-600 hover:text-slate-900"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Inspect
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Snapshot Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" />
              <span>Persist Analytics Snapshot to Database</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will capture the complete current state of MediConnect (users, pharmacies, inventory valuation, MINSANTÉ clearance status, regional coverage) and write a permanent record to the MongoDB Atlas database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Snapshot Notes / Description</label>
              <Input
                placeholder="e.g. Q3 2026 National Healthcare Inspection Baseline"
                value={snapshotNotes}
                onChange={(e) => setSnapshotNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Database:</span>
                <span className="font-semibold text-slate-800">MongoDB Atlas (mediconnect)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Collection:</span>
                <span className="font-mono text-emerald-700 font-medium">systemanalytics</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Users:</span>
                <span className="font-semibold text-slate-800">{summary?.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Stock Value:</span>
                <span className="font-semibold text-emerald-700">{(summary?.totalStockValueXaf || 0).toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveModal(false)}
              disabled={isSavingSnapshot}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSnapshot}
              disabled={isSavingSnapshot}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              {isSavingSnapshot ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving to Database...
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 mr-1.5" />
                  Confirm & Save Snapshot
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Snapshot Inspection Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <span>Snapshot Details — {selectedSnapshot?._id}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Captured on {selectedSnapshot ? new Date(selectedSnapshot.createdAt).toLocaleString() : ''} by {selectedSnapshot?.capturedByName}
            </DialogDescription>
          </DialogHeader>

          {selectedSnapshot && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-700 mb-1">Notes / Description:</p>
                <p className="text-slate-600 italic">{selectedSnapshot.notes || 'No notes provided'}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 bg-blue-50 rounded-lg">
                  <p className="text-slate-500 text-[10px]">Total Users</p>
                  <p className="text-lg font-bold text-blue-900">{selectedSnapshot.summary?.totalUsers}</p>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg">
                  <p className="text-slate-500 text-[10px]">Stock Valuation</p>
                  <p className="text-lg font-bold text-emerald-800">{selectedSnapshot.summary?.totalStockValueXaf?.toLocaleString()} FCFA</p>
                </div>
                <div className="p-2.5 bg-purple-50 rounded-lg">
                  <p className="text-slate-500 text-[10px]">Stock Units</p>
                  <p className="text-lg font-bold text-purple-900">{selectedSnapshot.summary?.totalStockUnits?.toLocaleString()}</p>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-lg">
                  <p className="text-slate-500 text-[10px]">Active Campaigns</p>
                  <p className="text-lg font-bold text-amber-800">{selectedSnapshot.summary?.activeCampaigns}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto max-h-[220px]">
                <pre>{JSON.stringify(selectedSnapshot.summary, null, 2)}</pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button size="sm" onClick={() => setShowDetailModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}