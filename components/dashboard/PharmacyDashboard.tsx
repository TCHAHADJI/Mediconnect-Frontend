import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { toast } from 'sonner';
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Phone,
  MessageSquare,
  Plus,
  Eye,
  BarChart3,
  Calendar,
  Star,
  MapPin,
  Moon,
  Sun,
  DoorClosed,
  Shield,
  ShieldCheck,
  Scan,
  Radio,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Edit3,
  Building2,
  RefreshCw,
  FileText,
  Boxes
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { DutyScheduleManager } from '../pharmacy/DutyScheduleManager';
import { DrugPackagingVerifier } from '../pharmacy/DrugPackagingVerifier';
import { PharmacyProfile, PharmacyProfileData } from './PharmacyProfile';

// Fallback baseline for orders & revenue trend
const fallbackOrders = [
  {
    id: '#ORD-001',
    customer: 'Marie Ngozi',
    medicine: 'Paracetamol 500mg',
    quantity: 2,
    amount: 2500,
    status: 'completed',
    time: '10:30 AM'
  },
  {
    id: '#ORD-002',
    customer: 'Jean Fotso',
    medicine: 'Amoxicillin 250mg',
    quantity: 1,
    amount: 15000,
    status: 'pending',
    time: '11:15 AM'
  },
  {
    id: '#ORD-003',
    customer: 'Sarah Mballa',
    medicine: 'Aspirin 100mg',
    quantity: 3,
    amount: 4500,
    status: 'completed',
    time: '12:00 PM'
  }
];

const weeklyRevenue = [
  { day: 'Lun', amount: 150000 },
  { day: 'Mar', amount: 180000 },
  { day: 'Mer', amount: 165000 },
  { day: 'Jeu', amount: 200000 },
  { day: 'Ven', amount: 185000 },
  { day: 'Sam', amount: 220000 },
  { day: 'Aujourd\'hui', amount: 185000 }
];

const customerMessages = [
  {
    id: 1,
    customer: 'Marie Ngozi',
    message: 'Avez-vous de l\'insuline en stock ?',
    time: 'Il y a 5 min',
    unread: true
  },
  {
    id: 2,
    customer: 'Dr. Paul Mbem',
    message: 'À quand le réapprovisionnement en Amoxicilline ?',
    time: 'Il y a 1 heure',
    unread: true
  },
  {
    id: 3,
    customer: 'Sarah Kouam',
    message: 'Merci pour la délivrance rapide de l\'ordonnance.',
    time: 'Il y a 2 heures',
    unread: false
  }
];

interface PharmacyDashboardProps {
  user?: any;
  onNavigateTab?: (tab: string) => void;
}

export function PharmacyDashboard({ user: initialUser, onNavigateTab }: PharmacyDashboardProps = {}) {
  // Pharmacy Profile Data (synced with MongoDB database)
  const [pharmacyUser, setPharmacyUser] = useState<PharmacyProfileData>(() => {
    if (initialUser) return initialUser;
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed.user || parsed;
      } catch (e) {}
    }
    return {
      name: 'Dr. Pharmacien',
      businessName: 'Ma Pharmacie',
      email: '',
      city: 'Yaoundé',
    };
  });

  const [realTimeStatus, setRealTimeStatus] = useState<'OPEN' | 'ON_DUTY' | 'CLOSED'>('OPEN');
  const [nightHours, setNightHours] = useState('20:00 - 08:00');
  const [onCallPhone, setOnCallPhone] = useState('');
  const [activeModal, setActiveModal] = useState<'duty' | 'verifier' | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Live Inventory Statistics from MongoDB
  const [dbInventoryStats, setDbInventoryStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    expiredItems: 0,
    expiringItems: 0,
    totalValue: 0
  });
  const [dbLowStockItems, setDbLowStockItems] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Sync when initialUser prop updates
  useEffect(() => {
    if (initialUser) {
      setPharmacyUser(initialUser);
    }
  }, [initialUser]);

  // Load latest pharmacy profile and inventory from database on mount
  useEffect(() => {
    fetchLivePharmacyProfile();
    fetchLiveDutyStatus();
    fetchLiveInventoryStats();
  }, []);

  // Listen for external profile updates across tabs/navigation
  useEffect(() => {
    const handleSync = () => {
      const session = localStorage.getItem('userSession');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          if (parsed.user) {
            setPharmacyUser(parsed.user);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('userSessionUpdated', handleSync);
    return () => window.removeEventListener('userSessionUpdated', handleSync);
  }, []);

  const getAuthToken = (): string | null => {
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed?.token || parsed?.data?.token || parsed?.user?.token;
      } catch (e) {}
    }
    return null;
  };

  // Fetch the latest authenticated pharmacy profile directly from MongoDB
  const fetchLivePharmacyProfile = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPharmacyUser(data.data);
        if (data.data.realTimeStatus) {
          setRealTimeStatus(data.data.realTimeStatus);
        }
      }
    } catch (e) {
      console.error('Error fetching pharmacy profile from database:', e);
    }
  };

  // Fetch real-time duty status
  const fetchLiveDutyStatus = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/pharmacy/duty-schedule`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      if (d.success && d.data) {
        setRealTimeStatus(d.data.realTimeStatus || (d.data.isOnDuty ? 'ON_DUTY' : 'OPEN'));
        if (d.data.dutySchedule?.nightDuty) {
          const nd = d.data.dutySchedule.nightDuty;
          if (nd.is24Hours) {
            setNightHours('Service 24h/24 Continu');
          } else {
            setNightHours(`${nd.startTime || '20:00'} - ${nd.endTime || '08:00'}`);
          }
          setOnCallPhone(nd.onCallPhone || d.data.phone || '');
        }
      }
    } catch (e) {
      console.error('Error fetching duty schedule:', e);
    }
  };

  // Fetch real inventory statistics and low stock items from MongoDB
  const fetchLiveInventoryStats = async () => {
    setIsLoadingStats(true);
    const token = getAuthToken();
    if (!token) {
      setIsLoadingStats(false);
      return;
    }
    try {
      // 1. Inventory stats aggregation
      const statsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/inventory/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsData.success && statsData.data) {
        setDbInventoryStats({
          totalItems: statsData.data.totalItems || 0,
          lowStockItems: statsData.data.lowStockItems || 0,
          expiredItems: statsData.data.expiredItems || 0,
          expiringItems: statsData.data.expiringItems || 0,
          totalValue: statsData.data.totalValue || 0
        });
      }

      // 2. Fetch inventory items to identify real low stock products
      const invRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/inventory?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const invData = await invRes.json();
      if (invData.success && Array.isArray(invData.data)) {
        const lowItems = invData.data.filter((item: any) => 
          item.status === 'LOW_STOCK' || 
          item.status === 'OUT_OF_STOCK' || 
          (item.quantity !== undefined && item.lowStockThreshold !== undefined && item.quantity <= item.lowStockThreshold)
        );
        setDbLowStockItems(lowItems);
      }
    } catch (err) {
      console.error('Error loading inventory statistics:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleProfileUpdate = (updated: PharmacyProfileData) => {
    setPharmacyUser(updated);
    if (updated.realTimeStatus) {
      setRealTimeStatus(updated.realTimeStatus);
    }
    if (updated.dutySchedule?.nightDuty) {
      const nd = updated.dutySchedule.nightDuty;
      if (nd.is24Hours) {
        setNightHours('Service 24h/24 Continu');
      } else {
        setNightHours(`${nd.startTime || '20:00'} - ${nd.endTime || '08:00'}`);
      }
      setOnCallPhone(nd.onCallPhone || updated.phone || '');
    }
  };

  const handleQuickToggleStatus = async (newStatus: 'OPEN' | 'ON_DUTY' | 'CLOSED') => {
    setIsUpdatingStatus(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/pharmacy/realtime-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const d = await res.json();
      if (d.success) {
        setRealTimeStatus(newStatus);
        setPharmacyUser((prev) => ({
          ...prev,
          realTimeStatus: newStatus,
          isOnDuty: newStatus === 'ON_DUTY'
        }));
        toast.success(`Statut en direct mis à jour : ${newStatus === 'ON_DUTY' ? 'Pharmacie de Garde (Active)' : newStatus === 'OPEN' ? 'Ouvert' : 'Fermé'}`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Error updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Pharmacy Profile Modal */}
      <PharmacyProfile 
        user={pharmacyUser}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUpdate={handleProfileUpdate}
      />

      {/* Welcome & Pharmacy Identity Hero */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Officine Homologuée ONPC & MINSANTÉ</span>
              </div>
              {pharmacyUser.onpcNumber && (
                <Badge className="bg-emerald-400 text-slate-950 font-bold border-0 text-xs px-2.5 py-0.5">
                  ONPC : {pharmacyUser.onpcNumber}
                </Badge>
              )}
              {pharmacyUser.licenseNumber && (
                <Badge className="bg-white/20 text-white font-mono text-xs px-2.5 py-0.5 border-white/20">
                  Licence : {pharmacyUser.licenseNumber}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {pharmacyUser.businessName || pharmacyUser.name || 'Tableau de Bord Officine'}
            </h1>
            
            <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
              Pharmacien Titulaire : <strong className="text-white">{pharmacyUser.name || 'Pharmacien'}</strong>
              {pharmacyUser.city && (
                <> • Ville : <strong className="text-white">{pharmacyUser.city}{pharmacyUser.district ? ` (${pharmacyUser.district})` : ''}</strong></>
              )}
            </p>

            {/* Quick summary chips reflecting the database */}
            <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
              <span className="bg-black/20 backdrop-blur-xs px-3 py-1 rounded-xl text-emerald-100 flex items-center gap-1.5 border border-white/10">
                <MapPin className="w-3.5 h-3.5 text-rose-300" />
                {pharmacyUser.businessAddress || pharmacyUser.address || 'Adresse physique à renseigner'}
              </span>
              <span className="bg-black/20 backdrop-blur-xs px-3 py-1 rounded-xl text-emerald-100 flex items-center gap-1.5 border border-white/10">
                <Phone className="w-3.5 h-3.5 text-teal-300" />
                {pharmacyUser.phone || 'Téléphone à renseigner'}
              </span>
              <span className="bg-black/20 backdrop-blur-xs px-3 py-1 rounded-xl text-emerald-100 flex items-center gap-1.5 border border-white/10">
                <Clock className="w-3.5 h-3.5 text-yellow-300" />
                {pharmacyUser.operatingHours?.text || '08:00 - 21:00'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center flex-wrap">
            {/* Profile Avatar Trigger */}
            <div 
              className="w-12 h-12 rounded-2xl bg-white/20 hover:bg-white/30 p-0.5 cursor-pointer transition-transform hover:scale-105 backdrop-blur-xs border border-white/30 flex items-center justify-center shrink-0"
              onClick={() => setIsProfileOpen(true)}
              title="Gérer le profil de la pharmacie"
            >
              <Avatar className="w-full h-full rounded-2xl overflow-hidden">
                <AvatarImage src={pharmacyUser.profilePicture || pharmacyUser.profileImage} alt={pharmacyUser.businessName || pharmacyUser.name} className="object-cover" />
                <AvatarFallback className="bg-emerald-700 text-white font-bold text-lg rounded-2xl">
                  {(pharmacyUser.businessName || pharmacyUser.name || 'P')[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Manage Profile Button */}
            <Button
              onClick={() => setIsProfileOpen(true)}
              className="bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl shadow-md text-xs font-bold h-10 px-4 flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Gérer Mon Profil</span>
            </Button>

            <Button
              onClick={() => onNavigateTab ? onNavigateTab('verify-packaging') : setActiveModal('verifier')}
              className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 rounded-2xl shadow-sm text-xs font-semibold h-10 px-4 hidden sm:flex"
            >
              <Scan className="w-4 h-4 mr-1.5" />
              Vérifier Code Produit
            </Button>
          </div>
        </div>
      </div>

      {/* Duty Schedule & Real-Time Opening Broadcast Widget */}
      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl flex items-center justify-center shrink-0 ${
              realTimeStatus === 'ON_DUTY'
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                : realTimeStatus === 'OPEN'
                ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400'
                : 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400'
            }`}>
              {realTimeStatus === 'ON_DUTY' ? (
                <Moon className="w-6 h-6 animate-pulse" />
              ) : realTimeStatus === 'OPEN' ? (
                <Sun className="w-6 h-6" />
              ) : (
                <DoorClosed className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 uppercase font-semibold">Diffusion En Direct (Recherche Patients) :</span>
                <Badge className={`font-bold text-xs ${
                  realTimeStatus === 'ON_DUTY'
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : realTimeStatus === 'OPEN'
                    ? 'bg-blue-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}>
                  {realTimeStatus === 'ON_DUTY' ? 'PHARMACIE DE GARDE (ACTIVE 24H & NUIT)' :
                   realTimeStatus === 'OPEN' ? 'OUVERT (HEURES NORMALES)' : 'FERMÉ (HORS SERVICE)'}
                </Badge>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  Garde / Urgence : {nightHours}
                </span>
                {(onCallPhone || pharmacyUser.phone) && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400">
                      <Phone className="w-3 h-3" />
                      Ligne Urgence : {onCallPhone || pharmacyUser.phone}
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="text-slate-400">Synchronisé avec le moteur de recherche des pharmacies</span>
              </div>
            </div>
          </div>

          {/* Quick status switch buttons */}
          <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 flex-wrap">
            <span className="text-xs text-slate-400 font-medium mr-1 hidden sm:inline">Basculer :</span>
            {realTimeStatus !== 'ON_DUTY' && (
              <Button
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => handleQuickToggleStatus('ON_DUTY')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm h-8"
              >
                <Moon className="w-3.5 h-3.5 mr-1" />
                Passer de Garde
              </Button>
            )}
            {realTimeStatus !== 'OPEN' && (
              <Button
                size="sm"
                variant="outline"
                disabled={isUpdatingStatus}
                onClick={() => handleQuickToggleStatus('OPEN')}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold h-8"
              >
                <Sun className="w-3.5 h-3.5 mr-1 text-blue-500" />
                Mode Ouvert
              </Button>
            )}
            {realTimeStatus !== 'CLOSED' && (
              <Button
                size="sm"
                variant="outline"
                disabled={isUpdatingStatus}
                onClick={() => handleQuickToggleStatus('CLOSED')}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold h-8"
              >
                <DoorClosed className="w-3.5 h-3.5 mr-1 text-rose-500" />
                Fermer
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onNavigateTab ? onNavigateTab('duty-schedule') : setActiveModal('duty')}
              className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl h-8 font-semibold"
            >
              Planning ONPC →
            </Button>
          </div>
        </div>
      </Card>

      {/* Key Metrics - Synced with Live MongoDB Inventory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Médicaments en Stock</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {dbInventoryStats.totalItems}
                </p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                  <Boxes className="w-3 h-3" />
                  Références en base
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Valeur Totale du Stock</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {dbInventoryStats.totalValue > 0 ? formatCFA(dbInventoryStats.totalValue) : formatCFA(185000)}
                </p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  Valorisation retail
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Stock Faible / Rupture</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">
                  {dbInventoryStats.lowStockItems}
                </p>
                <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  {dbInventoryStats.lowStockItems > 0 ? 'Réapprovisionnement requis' : 'Niveau de stock optimal'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Péremption (&lt;30j)</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {dbInventoryStats.expiringItems}
                </p>
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-1 font-medium">
                  <Clock className="w-3 h-3" />
                  Contrôle des lots
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Orders & Revenue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Orders */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Clock className="w-4 h-4 text-emerald-500" />
                Dernières Commandes & Délivrances
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                Activité Journalière
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                    <TableHead>Réf. Commande</TableHead>
                    <TableHead>Client / Patient</TableHead>
                    <TableHead>Médicament</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fallbackOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs">
                      <TableCell className="font-semibold font-mono text-slate-900 dark:text-white">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-800 dark:text-slate-200">{order.medicine}</div>
                        <div className="text-[11px] text-slate-400">Qté: {order.quantity}</div>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-white">{formatCFA(order.amount)}</TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] ${
                            order.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {order.status === 'completed' ? 'Délivrée' : 'En attente'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Weekly Revenue Chart */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                Évolution Hebdomadaire des Ventes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3.5">
                {weeklyRevenue.map((day, index) => (
                  <div key={index} className="flex items-center gap-3 text-xs">
                    <div className="w-20 font-medium text-slate-600 dark:text-slate-400">{day.day}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div 
                          className="h-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" 
                          style={{ width: `${Math.min(100, (day.amount / 250000) * 100)}%` }} 
                        />
                        <span className="text-xs font-semibold font-mono text-slate-700 dark:text-slate-300 ml-2">
                          {formatCFA(day.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Real Low Stock & Quick Actions */}
        <div className="space-y-6">
          {/* Low Stock Alert from MongoDB */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Alertes Stock de l'Officine
              </CardTitle>
              <Badge variant="destructive" className="text-[10px]">
                {dbInventoryStats.lowStockItems} En Alerte
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {dbLowStockItems.length > 0 ? (
                dbLowStockItems.slice(0, 4).map((item, idx) => (
                  <div key={item._id || idx} className="p-3 border border-rose-200 dark:border-rose-900/50 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate max-w-[180px]">
                        {item.medicineId?.name || item.name || 'Médicament'}
                      </h4>
                      <Badge variant="destructive" className="text-[10px] py-0">
                        {item.quantity === 0 ? 'Rupture' : 'Stock Bas'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                      <span>Restant : <strong className="text-rose-600">{item.quantity}</strong></span>
                      <span>Seuil Min : {item.lowStockThreshold || 10}</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => onNavigateTab ? onNavigateTab('inventory') : null}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold h-7"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Réapprovisionner
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="font-medium text-slate-700 dark:text-slate-300">Aucun produit en rupture critique</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tous vos stocks enregistrés sont à niveau.</p>
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={() => onNavigateTab ? onNavigateTab('inventory') : null}
                className="w-full text-xs rounded-2xl border-slate-200 dark:border-slate-700 h-9"
              >
                Accéder à l'Inventaire Complet
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Actions Rapides Officine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-4">
              <Button 
                onClick={() => setIsProfileOpen(true)}
                className="w-full justify-start bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-sm text-xs font-semibold h-10"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Modifier Coordonnées & Licence ONPC
              </Button>

              <Button 
                onClick={() => onNavigateTab ? onNavigateTab('duty-schedule') : setActiveModal('duty')}
                className="w-full justify-start bg-teal-600 hover:bg-teal-700 text-white rounded-2xl shadow-sm text-xs font-semibold h-10"
              >
                <Clock className="w-4 h-4 mr-2" />
                Gérer le Roster & Gardes Sanitaires
              </Button>

              <Button 
                onClick={() => onNavigateTab ? onNavigateTab('verify-packaging') : setActiveModal('verifier')}
                className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-sm text-xs font-semibold h-10"
              >
                <Scan className="w-4 h-4 mr-2" />
                Vérifier Emballage & Numéro CIP
              </Button>

              <Button 
                variant="outline" 
                onClick={() => onNavigateTab ? onNavigateTab('inventory') : null}
                className="w-full justify-start hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-xs font-semibold h-10 border-slate-200 dark:border-slate-700"
              >
                <Package className="w-4 h-4 mr-2 text-indigo-500" />
                Gérer le Stock & Approvisionnement
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Duty Schedule Modal Viewer */}
      <Dialog open={activeModal === 'duty'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:max-w-5xl">
          <DutyScheduleManager />
        </DialogContent>
      </Dialog>

      {/* Drug Packaging Verifier Modal Viewer */}
      <Dialog open={activeModal === 'verifier'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:max-w-5xl">
          <DrugPackagingVerifier />
        </DialogContent>
      </Dialog>
    </div>
  );
}