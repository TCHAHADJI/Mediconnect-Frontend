import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { 
  Search, 
  Download, 
  Activity, 
  Users, 
  ShieldCheck, 
  Database, 
  RefreshCw, 
  Loader2, 
  Eye, 
  Clock, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Building2,
  Pill,
  Lock,
  HeartPulse,
  Sparkles,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface AuditUser {
  id: string | null;
  name: string;
  email: string;
  userType: string;
  organization?: string | null;
  businessName?: string | null;
}

interface AuditLog {
  _id: string;
  id: string;
  timestamp: string;
  createdAt: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  user: AuditUser;
}

interface AuditStats {
  totalEvents: number;
  filteredCount: number;
  last24hEvents: number;
  uniqueUsers: number;
  clearanceEvents: number;
}

type MediConnectDomainFilter = 'ALL' | 'PUBLIC_HEALTH' | 'PHARMACY' | 'CATALOGUE' | 'SECURITY';

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    totalEvents: 0,
    filteredCount: 0,
    last24hEvents: 0,
    uniqueUsers: 0,
    clearanceEvents: 0
  });
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableResources, setAvailableResources] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState<MediConnectDomainFilter>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication required to access the MediConnect audit trail.');
      setIsLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (resourceFilter !== 'all') params.append('resource', resourceFilter);
      params.append('limit', '100');

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/audit-logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load MediConnect audit records from database.');
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        setLogs(resData.data.logs || []);
        if (resData.data.stats) setStats(resData.data.stats);
        if (resData.data.availableActions) setAvailableActions(resData.data.availableActions);
        if (resData.data.availableResources) setAvailableResources(resData.data.availableResources);
      } else {
        throw new Error(resData.message || 'Error parsing MediConnect audit trail.');
      }
    } catch (err: any) {
      console.error('Audit logs error:', err);
      toast.error(err.message || 'Could not connect to MediConnect audit ledger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, resourceFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuditLogs();
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    const token = getAuthToken();
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const params = new URLSearchParams();
      params.append('format', 'csv');
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (resourceFilter !== 'all') params.append('resource', resourceFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`${apiBase}/audit-logs/export?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Export failed.');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mediconnect_national_audit_ledger_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('MediConnect audit trail exported successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export audit logs');
    } finally {
      setIsExporting(false);
    }
  };

  // Maps raw database resources and actions into clean MediConnect functional domains
  const getMediConnectDomain = (resource: string, action: string) => {
    const res = (resource || '').toUpperCase();
    const act = (action || '').toUpperCase();

    if (res === 'HEALTHTIP' || act.includes('HEALTH_TIP') || act.includes('CAMPAIGN') || act.includes('ALERT') || res === 'CAMPAIGN') {
      return {
        key: 'PUBLIC_HEALTH',
        name: 'Public Health & MINSANTÉ',
        icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
      };
    }
    if (res === 'INVENTORY' || act.includes('INVENTORY') || res === 'PHARMACY' || act.includes('DUTY') || act.includes('STOCK')) {
      return {
        key: 'PHARMACY',
        name: 'Pharmacy Network & Inventory',
        icon: <Building2 className="w-3.5 h-3.5 text-blue-600" />,
        badge: 'bg-blue-50 text-blue-800 border-blue-200'
      };
    }
    if (res === 'MASTER_MEDICINE' || res === 'MEDICINE' || act.includes('MEDICINE') || act.includes('EQUIVALENCE')) {
      return {
        key: 'CATALOGUE',
        name: 'National Drug Catalogue (LNSPM)',
        icon: <Pill className="w-3.5 h-3.5 text-indigo-600" />,
        badge: 'bg-indigo-50 text-indigo-800 border-indigo-200'
      };
    }
    if (res === 'USER' || res === 'HEALTHAUTHORITY' || act.includes('LOGIN') || act.includes('AUTH') || act.includes('CREDENTIAL')) {
      return {
        key: 'SECURITY',
        name: 'Identity & Access Governance',
        icon: <Lock className="w-3.5 h-3.5 text-purple-600" />,
        badge: 'bg-purple-50 text-purple-800 border-purple-200'
      };
    }
    return {
      key: 'CORE',
      name: 'MediConnect Core Platform',
      icon: <Database className="w-3.5 h-3.5 text-slate-600" />,
      badge: 'bg-slate-50 text-slate-700 border-slate-200'
    };
  };

  // Translates raw database action codes into clear, contextual MediConnect operations
  const getActionDescriptor = (action: string) => {
    switch (action) {
      case 'CREATE_DRAFT_HEALTH_TIP':
        return 'Draft Health Tip Submitted (Pending MINSANTÉ Clearance)';
      case 'APPROVE_HEALTH_TIP':
        return 'MINSANTÉ Public Health Clearance Approved & Published';
      case 'REJECT_HEALTH_TIP':
        return 'Health Tip Rejected with Regulatory Directives';
      case 'CREATE_OFFICIAL_HEALTH_TIP':
        return 'Official MINSANTÉ National Health Advisory Broadcast';
      case 'CREATE_MASTER_MEDICINE':
        return 'Registered in Cameroon Master Medicine Registry';
      case 'UPDATE_MASTER_MEDICINE':
        return 'Master Drug Specifications & Bioequivalence Updated';
      case 'UPDATE_HEALTH_AUTHORITY_CREDENTIALS':
        return 'Health Authority (MINSANTÉ) Access Credentials Updated';
      case 'RESET_HEALTH_AUTHORITY_CREDENTIALS':
        return 'Health Authority Credentials Reset to Standard Default';
      case 'LOGIN_SUCCESS':
        return 'Authorized Stakeholder Login to MediConnect';
      case 'USER_REGISTERED':
        return 'New Account Enrolled in MediConnect Ecosystem';
      case 'CREATE_CAMPAIGN':
        return 'National Public Health Campaign Launched';
      case 'CREATE':
        return 'Resource Created';
      case 'UPDATE':
        return 'Resource Modified';
      case 'DELETE':
        return 'Resource Removed';
      default:
        return action.replace(/_/g, ' ');
    }
  };

  const getActionBadge = (action: string) => {
    const act = (action || '').toUpperCase();

    if (act.includes('APPROVE') || act.includes('VERIF') || act.includes('SUCCESS')) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold rounded-xl text-[11px] gap-1 px-2.5 py-0.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          {act.replace(/_/g, ' ')}
        </Badge>
      );
    }
    if (act.includes('CREATE') || act.includes('ADD')) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border border-blue-300 font-semibold rounded-xl text-[11px] gap-1 px-2.5 py-0.5">
          <Activity className="w-3 h-3 text-blue-600 shrink-0" />
          {act.replace(/_/g, ' ')}
        </Badge>
      );
    }
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('MODIFY') || act.includes('RESET')) {
      return (
        <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-semibold rounded-xl text-[11px] gap-1 px-2.5 py-0.5">
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          {act.replace(/_/g, ' ')}
        </Badge>
      );
    }
    if (act.includes('REJECT') || act.includes('DELETE') || act.includes('SUSPEND') || act.includes('FAIL')) {
      return (
        <Badge className="bg-rose-100 text-rose-800 border border-rose-300 font-semibold rounded-xl text-[11px] gap-1 px-2.5 py-0.5">
          <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
          {act.replace(/_/g, ' ')}
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-100 text-slate-800 border border-slate-300 font-semibold rounded-xl text-[11px] gap-1 px-2.5 py-0.5">
        <Database className="w-3 h-3 text-slate-600 shrink-0" />
        {act.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const getUserRoleBadge = (userType?: string) => {
    switch ((userType || '').toUpperCase()) {
      case 'ADMIN':
        return <Badge className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 font-semibold">MediConnect Admin</Badge>;
      case 'HEALTH_AUTHORITY':
        return <Badge className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold">MINSANTÉ Authority</Badge>;
      case 'PHARMACY':
        return <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 font-semibold">Licensed Pharmacy</Badge>;
      case 'PATIENT':
        return <Badge className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 font-semibold">Verified Patient</Badge>;
      default:
        return <Badge className="text-[10px] bg-gray-100 text-gray-700 border-gray-200 font-semibold">MediConnect Core</Badge>;
    }
  };

  const formatDetailsPreview = (details: Record<string, any>) => {
    if (!details || Object.keys(details).length === 0) return 'Operational record confirmed';

    if (details.title) return `"${details.title}" ${details.category ? `(${details.category})` : ''}`;
    if (details.medicineName) return `Medicine: ${details.medicineName}`;
    if (details.targetEmail) return `Account: ${details.targetEmail} (${details.organization || 'MINSANTÉ'})`;
    if (details.name) return `Subject: ${details.name}`;
    if (details.notes) return `Inspector Note: ${details.notes}`;
    if (details.reason) return `Reason: ${details.reason}`;

    const pairs = Object.entries(details)
      .filter(([k]) => k !== '_id' && k !== '__v')
      .slice(0, 2)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);

    return pairs.join(' | ') || 'MediConnect Audit Log';
  };

  // Filter logs by MediConnect domain tabs
  const displayedLogs = logs.filter(log => {
    if (domainFilter === 'ALL') return true;
    const domain = getMediConnectDomain(log.resource, log.action);
    return domain.key === domainFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header with MediConnect Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-primary-100 shadow-soft">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">MediConnect National Audit Trail & Compliance Observatory</h2>
            <Badge variant="outline" className="border-primary-200 text-primary-700 bg-primary-50 text-[10px] font-semibold">
              🇨🇲 Republic of Cameroon
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Cryptographically timestamped compliance ledger tracking clinical clearances, MINSANTÉ public health advisories, pharmacy dispensing stocks, and access security across the MediConnect ecosystem.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchAuditLogs}
            disabled={isLoading}
            className="rounded-2xl text-xs border-primary-200 hover:bg-primary-50 text-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleExportCsv}
            disabled={isExporting || logs.length === 0}
            className="gradient-bg-primary text-white hover-lift rounded-2xl text-xs font-semibold shadow-soft"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-1.5" />
            )}
            Export Audit Trail (CSV)
          </Button>
        </div>
      </div>

      {/* MediConnect Ecosystem Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-primary-100 bg-white shadow-soft">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total MediConnect Events</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalEvents}</p>
                <span className="text-[10px] text-emerald-600 font-medium">Logged in MongoDB Atlas</span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                <Database className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border border-emerald-100 bg-white shadow-soft">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-800">Regulatory Clearances (MINSANTÉ)</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{stats.clearanceEvents}</p>
                <span className="text-[10px] text-emerald-700 font-medium">Advisories & Homologations</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-purple-100 bg-white shadow-soft">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-800">Active Ecosystem Actors</p>
                <p className="text-2xl font-black text-purple-600 mt-1">{stats.uniqueUsers}</p>
                <span className="text-[10px] text-purple-700 font-medium">Admins, Authorities, Pharmacies</span>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-amber-100 bg-white shadow-soft">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-800">Activity in Last 24 Hours</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{stats.last24hEvents}</p>
                <span className="text-[10px] text-amber-700 font-medium">Recent platform actions</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MediConnect Functional Domain Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Button
          variant={domainFilter === 'ALL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDomainFilter('ALL')}
          className={`rounded-2xl text-xs whitespace-nowrap ${
            domainFilter === 'ALL' ? 'gradient-bg-primary text-white shadow-soft' : 'border-primary-200 bg-white text-slate-700'
          }`}
        >
          All Domains ({logs.length})
        </Button>
        <Button
          variant={domainFilter === 'PUBLIC_HEALTH' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDomainFilter('PUBLIC_HEALTH')}
          className={`rounded-2xl text-xs whitespace-nowrap ${
            domainFilter === 'PUBLIC_HEALTH' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-primary-200 bg-white text-emerald-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5 mr-1 text-emerald-600" />
          🛡️ Public Health & MINSANTÉ
        </Button>
        <Button
          variant={domainFilter === 'PHARMACY' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDomainFilter('PHARMACY')}
          className={`rounded-2xl text-xs whitespace-nowrap ${
            domainFilter === 'PHARMACY' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-primary-200 bg-white text-blue-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 mr-1 text-blue-600" />
          🏥 Pharmacy Network & Inventory
        </Button>
        <Button
          variant={domainFilter === 'CATALOGUE' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDomainFilter('CATALOGUE')}
          className={`rounded-2xl text-xs whitespace-nowrap ${
            domainFilter === 'CATALOGUE' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border-primary-200 bg-white text-indigo-800'
          }`}
        >
          <Pill className="w-3.5 h-3.5 mr-1 text-indigo-600" />
          💊 Master Medicine Catalogue (LNSPM)
        </Button>
        <Button
          variant={domainFilter === 'SECURITY' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDomainFilter('SECURITY')}
          className={`rounded-2xl text-xs whitespace-nowrap ${
            domainFilter === 'SECURITY' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'border-primary-200 bg-white text-purple-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5 mr-1 text-purple-600" />
          🔐 Access & Governance
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by action, topic, user, keyword, or IP..."
              className="pl-9 rounded-2xl text-xs border-primary-200"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Action Filter */}
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48 rounded-2xl text-xs border-primary-200 bg-white">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl text-xs max-h-64">
                <SelectItem value="all">All Actions ({availableActions.length})</SelectItem>
                {availableActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Resource Filter */}
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-44 rounded-2xl text-xs border-primary-200 bg-white">
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl text-xs">
                <SelectItem value="all">All Resources ({availableResources.length})</SelectItem>
                {availableResources.map(resource => (
                  <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              type="submit" 
              variant="outline" 
              size="sm"
              className="rounded-2xl text-xs border-primary-200"
            >
              Filter
            </Button>
          </div>
        </form>

        {/* Audit Logs Table */}
        <Card className="rounded-2xl border border-primary-100 bg-white shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70">
                  <TableHead className="text-xs font-bold text-slate-700">Timestamp</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">MediConnect Domain</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Actor / Stakeholder</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Operation / Action</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Audit Metadata & Details</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Client Origin</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-600 mx-auto" />
                      <p className="text-xs text-muted-foreground mt-2">Connecting to MediConnect audit ledger in MongoDB...</p>
                    </TableCell>
                  </TableRow>
                ) : displayedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                      <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      No MediConnect audit events found for this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedLogs.map((log) => {
                    const domain = getMediConnectDomain(log.resource, log.action);
                    const actionDescriptor = getActionDescriptor(log.action);
                    const dateFormatted = new Date(log.createdAt || log.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <TableRow key={log._id || log.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="text-xs text-slate-600 whitespace-nowrap font-mono">
                          {dateFormatted}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-semibold border ${domain.badge}`}>
                            {domain.icon}
                            {domain.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900 truncate max-w-[170px]" title={log.user?.email}>
                              {log.user?.name}
                            </span>
                            {getUserRoleBadge(log.user?.userType)}
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate block max-w-[170px]">
                            {log.user?.email}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="space-y-1">
                            <div>{getActionBadge(log.action)}</div>
                            <span className="text-[11px] text-slate-600 font-medium block leading-tight">
                              {actionDescriptor}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 max-w-[260px]">
                          <p className="truncate font-mono text-[11px]" title={JSON.stringify(log.details)}>
                            {formatDetailsPreview(log.details)}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground text-[11px]">
                          {log.ipAddress}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLog(log);
                              setIsDetailOpen(true);
                            }}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl"
                            title="Inspect event details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
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

      {/* Event Details Inspection Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl p-6 border border-primary-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary-600" />
              MediConnect Compliance Record Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-mono">
              Ledger ID: {selectedLog?._id}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2 flex-wrap">
                {getActionBadge(selectedLog.action)}
                <Badge variant="outline" className="text-xs border-primary-200 bg-slate-50 text-slate-700">
                  Resource: {selectedLog.resource}
                </Badge>
                {selectedLog.resourceId && (
                  <Badge variant="outline" className="text-[11px] font-mono text-muted-foreground border-slate-200">
                    Target ID: {selectedLog.resourceId}
                  </Badge>
                )}
              </div>

              {/* MediConnect Functional Domain Notice */}
              <div className="p-3 rounded-2xl bg-primary-50/50 border border-primary-100 flex items-center gap-2 text-xs text-primary-900">
                <Sparkles className="w-4 h-4 text-primary-600 shrink-0" />
                <span>
                  <strong>MediConnect Module:</strong> {getMediConnectDomain(selectedLog.resource, selectedLog.action).name}
                </span>
              </div>

              {/* Actor Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Actor Name:</span>
                  <span className="font-semibold text-slate-800">{selectedLog.user?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Stakeholder Classification:</span>
                  <span className="font-semibold text-slate-800">{selectedLog.user?.userType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Email Address:</span>
                  <span className="font-semibold text-slate-800">{selectedLog.user?.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Compliance Timestamp:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedLog.createdAt || selectedLog.timestamp).toLocaleString('en-US')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">IP Address:</span>
                  <span className="font-mono text-slate-800">{selectedLog.ipAddress}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Client User Agent:</span>
                  <span className="text-slate-800 truncate block" title={selectedLog.userAgent}>
                    {selectedLog.userAgent}
                  </span>
                </div>
              </div>

              {/* Payload Details */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Recorded Event Payload (JSON):</span>
                <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-xs max-h-72 overflow-y-auto">
                  <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
                </div>
              </div>

              <DialogFooter className="pt-2 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailOpen(false)}
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