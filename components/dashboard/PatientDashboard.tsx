import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { toast } from 'sonner';
import { 
  Search, 
  MapPin, 
  Pill, 
  Store, 
  Heart, 
  Clock, 
  Star, 
  Plus,
  Activity,
  TrendingUp,
  Bell,
  Calendar,
  BookOpen,
  Shield,
  Phone,
  Trash2,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Sparkles,
  Check,
  HeartPulse,
  FileText,
  QrCode,
  AlertTriangle,
  ChevronRight,
  Info,
  ExternalLink
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '../ui/dialog';
import { PatientProfile } from './PatientProfile';

export function PatientDashboard({ 
  user: initialUser, 
  onNavigateTab 
}: { 
  user: any; 
  onNavigateTab?: (tabId: string) => void;
}) {
  const [user, setUser] = useState(initialUser || {
    name: 'Patient',
    email: '',
    phone: '',
    address: '',
  });
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [nearbyPharmacies, setNearbyPharmacies] = useState<any[]>([]);
  const [isPharmaciesLoading, setIsPharmaciesLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [reminders, setReminders] = useState<any[]>([]);
  const [isRemindersLoading, setIsRemindersLoading] = useState(false);

  const handleProfileUpdate = (updatedUser: any) => {
    setUser(updatedUser);
  };

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser]);

  useEffect(() => {
    const handleSync = () => {
      const session = localStorage.getItem('userSession');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          if (parsed.user) {
            setUser(parsed.user);
            fetchHealthTips();
          }
        } catch (e) {}
      }
    };
    window.addEventListener('userSessionUpdated', handleSync);
    return () => window.removeEventListener('userSessionUpdated', handleSync);
  }, []);

  const handleDeleteSearch = (timestamp: string) => {
    const updatedSearches = recentSearches.filter(search => search.timestamp !== timestamp);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    toast.success('Search removed from history.');
  };

  useEffect(() => {
    const storedSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(storedSearches);
  }, []);

  const getAuthToken = () => {
    const session = localStorage.getItem('userSession');
    if (session) {
      const parsedSession = JSON.parse(session);
      return parsedSession?.token || parsedSession?.data?.token || parsedSession?.user?.data?.token;
    }
    return null;
  };

  const fetchReminders = async () => {
    setIsRemindersLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/reminders`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && data.data?.reminders) {
        setReminders(data.data.reminders);
      } else {
        const saved = localStorage.getItem('patientPillReminders');
        if (saved) setReminders(JSON.parse(saved));
      }
    } catch (e) {
      const saved = localStorage.getItem('patientPillReminders');
      if (saved) {
        try { setReminders(JSON.parse(saved)); } catch (err) {}
      }
    } finally {
      setIsRemindersLoading(false);
    }
  };

  const [healthTips, setHealthTips] = useState<any[]>([]);
  const [isTipsLoading, setIsTipsLoading] = useState(true);
  const [selectedTip, setSelectedTip] = useState<any | null>(null);
  const [patientProfileSummary, setPatientProfileSummary] = useState<any | null>(null);

  const fetchHealthTips = async () => {
    setIsTipsLoading(true);
    const token = getAuthToken();
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
    try {
      const res = await fetch(`${apiBase}/health-tips/recommended`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setHealthTips(data.data.slice(0, 4));
        if (data.patientProfile) {
          setPatientProfileSummary(data.patientProfile);
        }
      } else {
        // Fallback to all published tips if recommended endpoint is not available
        const fallbackRes = await fetch(`${apiBase}/health-tips`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success && Array.isArray(fallbackData.data)) {
          setHealthTips(fallbackData.data.slice(0, 4));
        } else {
          setHealthTips([]);
        }
      }
    } catch (err) {
      console.error('Failed to load recommended health tips in dashboard:', err);
      setHealthTips([]);
    } finally {
      setIsTipsLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
    fetchHealthTips();
  }, []);

  useEffect(() => {
    if (user) {
      fetchHealthTips();
    }
  }, [user]);

  const handleTakeDoseFromDashboard = async (reminderId: string, time: string) => {
    const token = getAuthToken();
    const today = new Date().toISOString().split('T')[0];

    // Optimistic update
    setReminders((prev) =>
      prev.map((r) => {
        if ((r._id || r.id) === reminderId) {
          const currentHist = (r.takenHistory || []).filter(
            (h: any) => !(h.date === today && h.time === time)
          );
          return {
            ...r,
            remainingPills: Math.max(0, (r.remainingPills || 1) - 1),
            takenHistory: [...currentHist, { date: today, time, status: 'TAKEN' }],
          };
        }
        return r;
      })
    );

    toast.success('Medication dose marked as taken! 🎉');

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/reminders/${reminderId}/take`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ time, status: 'TAKEN', date: today }),
      });
      fetchReminders();
    } catch (e) {}
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  useEffect(() => {
    const fetchNearbyPharmacies = async (location: { latitude: number; longitude: number } | null) => {
      setIsPharmaciesLoading(true);
      const token = getAuthToken();
      if (!token) {
        // No need to toast here, as it might be annoying on the dashboard
        setIsPharmaciesLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/pharmacies/approved`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch pharmacies.');
        
        const responseData = await response.json();
        if (!responseData.success || !Array.isArray(responseData.data)) {
          throw new Error('Invalid pharmacy data from server.');
        }

        const pharmaciesWithDistance = responseData.data.map((p: any) => {
          const distanceInKm = location && p.latitude && p.longitude
            ? calculateDistance(location.latitude, location.longitude, p.latitude, p.longitude)
            : Infinity;
          return {
            ...p,
            name: p.businessName,
            distance: distanceInKm === Infinity ? 'N/A' : `${distanceInKm.toFixed(1)} km`,
            distanceInKm,
            rating: 4.5, // Mocked for now
            open: true, // Mocked for now
          };
        }).sort((a: any, b: any) => {
          // Ensure pharmacies with no distance are pushed to the end
          const distA = a.distanceInKm ?? Infinity;
          const distB = b.distanceInKm ?? Infinity;
          if (distA === Infinity && distB === Infinity) return 0;
          return distA - distB;
        });

        setNearbyPharmacies(pharmaciesWithDistance.slice(0, 3)); // Get top 3 closest

      } catch (err: any) {
        console.error("Failed to fetch nearby pharmacies:", err.message);
      } finally {
        setIsPharmaciesLoading(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchNearbyPharmacies({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        },
        () => {
          fetchNearbyPharmacies(null); // Fetch without location if permission is denied
        }
      );
    } else {
      fetchNearbyPharmacies(null); // Fetch without location if geolocation is not available
    }
  }, []);

  const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) {
      return `${seconds} seconds ago`;
    } else if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else if (days === 1) {
      return `1 day ago`;
    } else {
      return `${days} days ago`;
    }
  };

  // CSU Health Coverage computations
  const csu = user?.csuInsurance || (user?.csuIdentifier ? {
    matricule: user.csuIdentifier,
    beneficiaryCategory: 'Régime Général (Assurés & Familles)',
    coverageRate: 70,
    affiliatedFacility: 'Hôpital Central de Yaoundé (HCY)',
    status: 'ACTIVE',
  } : null);
  const isCsuLinked = Boolean(csu && csu.matricule);

  // Today's scheduled doses computation
  const todayStr = new Date().toISOString().split('T')[0];
  const activeReminders = reminders.filter((r) => r.isActive !== false);
  const todayDoses: Array<{ reminder: any; time: string; isTaken: boolean }> = [];
  activeReminders.forEach((r) => {
    (r.times || []).forEach((t: string) => {
      const isTaken = (r.takenHistory || []).some(
        (h: any) => h.date === todayStr && h.time === t && h.status === 'TAKEN'
      );
      todayDoses.push({ reminder: r, time: t, isTaken });
    });
  });
  todayDoses.sort((a, b) => a.time.localeCompare(b.time));
  const completedTodayCount = todayDoses.filter((d) => d.isTaken).length;

  const booklet = user?.medicalBooklet || {};

  return (
    <div className="space-y-6">
      <PatientProfile 
        user={user}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUpdate={handleProfileUpdate}
      />

      {/* Welcome & Patient Summary Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-700 p-6 sm:p-7 text-white shadow-md">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border-0 text-xs px-2.5 py-0.5 font-medium">
                Espace Patient Sécurisé
              </Badge>
              {isCsuLinked && (
                <Badge className="bg-emerald-400 text-slate-950 font-bold border-0 text-xs px-2.5 py-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> CSU Active
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Bonjour, {user.name} !
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl leading-relaxed">
              Consultez vos rappels de prise, accédez à votre carnet médical d'urgence et découvrez vos conseils de santé personnalisés.
            </p>
            
            {/* Quick Health Summary Pills */}
            <div className="flex items-center gap-2 pt-2 flex-wrap text-xs">
              <span className="bg-black/20 backdrop-blur-xs px-3 py-1 rounded-xl text-blue-100 flex items-center gap-1.5 border border-white/10">
                <HeartPulse className="w-3.5 h-3.5 text-rose-300" />
                Groupe : <strong className="text-white">{booklet.bloodGroup || user?.bloodGroup || '—'}</strong>
              </span>
              <span className="bg-black/20 backdrop-blur-xs px-3 py-1 rounded-xl text-blue-100 flex items-center gap-1.5 border border-white/10">
                <Clock className="w-3.5 h-3.5 text-yellow-300" />
                Rappels : <strong className="text-white">{todayDoses.length > 0 ? `${completedTodayCount}/${todayDoses.length} prises` : '0 prise'}</strong>
              </span>
              <span className="bg-black/20 backdrop-blur-xs px-3 py-1 rounded-xl text-blue-100 flex items-center gap-1.5 border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                Conseils : <strong className="text-white">{healthTips.filter(t => t.isPersonalized).length} personnalisés</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <Button
              onClick={() => onNavigateTab ? onNavigateTab('booklet') : undefined}
              className="bg-white text-slate-900 hover:bg-blue-50 font-bold rounded-2xl shadow-sm text-xs h-10 px-4 flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4 text-rose-600" />
              <span>QR d'Urgence</span>
            </Button>
            <div
              className="w-12 h-12 rounded-2xl bg-white/20 hover:bg-white/30 p-0.5 cursor-pointer transition-transform hover:scale-105 backdrop-blur-xs border border-white/30 flex items-center justify-center"
              onClick={() => setIsProfileOpen(true)}
              title="Gérer mon profil"
            >
              <Avatar className="w-full h-full rounded-2xl">
                <AvatarImage src={user.profilePicture || user.profileImage} alt={user.name} className="object-cover rounded-2xl" />
                <AvatarFallback className="rounded-2xl bg-indigo-800 text-white font-bold">{user.name?.[0]}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid (6 symmetrical cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Card 
          onClick={() => onNavigateTab ? onNavigateTab('booklet') : undefined}
          className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] rounded-2xl border-rose-200/90 bg-rose-50/40"
        >
          <CardContent className="p-3.5 pt-4">
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-rose-950">Carnet & QR</h3>
              <p className="text-[11px] text-rose-600 font-medium">Secours 24/7</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => onNavigateTab ? onNavigateTab('prescriptions') : undefined}
          className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] rounded-2xl border-sky-200/90 bg-sky-50/40"
        >
          <CardContent className="p-3.5 pt-4">
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-sky-950">Ordonnances</h3>
              <p className="text-[11px] text-sky-600 font-medium">Numériques</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => onNavigateTab ? onNavigateTab('medicines') : undefined}
          className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] rounded-2xl border-slate-200 bg-white"
        >
          <CardContent className="p-3.5 pt-4">
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">Médicaments</h3>
              <p className="text-[11px] text-slate-500">Disponibilité</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => onNavigateTab ? onNavigateTab('pharmacies') : undefined}
          className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] rounded-2xl border-slate-200 bg-white"
        >
          <CardContent className="p-3.5 pt-4">
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">Pharmacies</h3>
              <p className="text-[11px] text-slate-500">De garde</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => onNavigateTab ? onNavigateTab('reminders') : undefined}
          className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] rounded-2xl border-indigo-200/90 bg-indigo-50/40"
        >
          <CardContent className="p-3.5 pt-4">
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-indigo-950">Rappels</h3>
              <p className="text-[11px] text-indigo-600 font-medium">
                {todayDoses.length > 0 ? `${completedTodayCount}/${todayDoses.length} prises` : 'Gestion'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => onNavigateTab ? onNavigateTab('csu') : setIsProfileOpen(true)}
          className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] rounded-2xl border-emerald-200/90 bg-emerald-50/40"
        >
          <CardContent className="p-3.5 pt-4">
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-emerald-950">CSU Santé</h3>
              <p className="text-[11px] text-emerald-700 font-medium">
                {isCsuLinked ? `${csu.coverageRate || 70}% Actif` : 'Associer'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Primary Care & Daily Health Activity): Medication Schedule + Recommended Health Tips */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Today's Pill Schedule Card */}
          <Card className="rounded-3xl border-slate-200 overflow-hidden shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-slate-900">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span>Today's Medication Schedule</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs rounded-full border-blue-200 text-blue-700 bg-white">
                    {completedTodayCount} of {todayDoses.length} taken
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onNavigateTab ? onNavigateTab('reminders') : undefined}
                    className="text-xs text-blue-700 hover:text-blue-800 p-0 h-auto font-bold hover:underline"
                  >
                    View All →
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {todayDoses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm font-medium text-slate-700 mb-1">No medication scheduled for today</p>
                  <p className="text-xs text-slate-500 mb-3">Add reminders to stay consistent with your doctor's prescriptions</p>
                  <Button
                    size="sm"
                    onClick={() => onNavigateTab ? onNavigateTab('reminders') : undefined}
                    className="bg-blue-600 text-white rounded-xl text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Set Medication Reminder
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {todayDoses.slice(0, 4).map((dose, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                        dose.isTaken ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                          {dose.time}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                            {dose.reminder.medicineName}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {dose.reminder.dosage} • {dose.reminder.foodInstructions?.replace('_', ' ').toLowerCase() || 'After meal'}
                          </p>
                        </div>
                      </div>

                      {dose.isTaken ? (
                        <Badge className="bg-emerald-600 text-white text-xs rounded-full px-2.5 py-0.5 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Taken
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleTakeDoseFromDashboard(dose.reminder._id || dose.reminder.id, dose.time)}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs h-8 px-3 font-semibold shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Take Dose
                        </Button>
                      )}
                    </div>
                  ))}

                  {todayDoses.length > 4 && (
                    <div className="text-center pt-1">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => onNavigateTab ? onNavigateTab('reminders') : undefined}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        + {todayDoses.length - 4} more doses scheduled today
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended Health Tips (Personalized from DB) */}
          <Card className="rounded-3xl border-slate-200/90 shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-3.5 bg-gradient-to-r from-emerald-50/50 via-white to-blue-50/30 border-b border-slate-100">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-800">
                  <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                  Recommended Health Tips
                </CardTitle>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {healthTips.some((t) => t.isPersonalized) && (
                    <Badge className="text-[10px] bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold px-2 py-0.5">
                      ✨ Personnalisé selon votre profil
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-700 bg-blue-50 font-medium">
                    MINSANTÉ
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Recommandations médicales personnalisées selon vos antécédents, votre génotype et vos allergies enregistrés dans votre carnet de santé.
              </p>
            </CardHeader>
            <CardContent className="pt-4 p-4 sm:p-5">
              {isTipsLoading ? (
                <div className="py-10 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  <span>Analyse de votre profil médical en cours...</span>
                </div>
              ) : healthTips.length === 0 ? (
                <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <BookOpen className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">Aucun conseil disponible pour le moment.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Les recommandations apparaîtront dès validation officielle.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {healthTips.map((tip, index) => {
                    const isUrgent = tip.priority === 'URGENT' || tip.priority === 'high' || tip.urgent;
                    const readTime = tip.readTime || `${Math.max(1, Math.ceil((tip.content?.length || 250) / 400))} min`;
                    const hasMatchReason = Boolean(tip.matchReason);
                    const isAllergyAlert = tip.matchReason?.toLowerCase().includes('allergie') || tip.matchReason?.toLowerCase().includes('alerte') || tip.category === 'ALLERGIES';

                    return (
                      <div 
                        key={tip._id || index} 
                        onClick={() => setSelectedTip(tip)}
                        className={`group p-3.5 border rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                          isAllergyAlert
                            ? 'bg-rose-50/40 border-rose-200/90 hover:bg-rose-50/80 hover:border-rose-300'
                            : tip.isPersonalized
                            ? 'bg-emerald-50/30 border-emerald-200/90 hover:bg-emerald-50/70 hover:border-emerald-300'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          {/* Personalized match badge */}
                          {hasMatchReason && (
                            <div className="mb-2">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${
                                isAllergyAlert
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              }`}>
                                {tip.matchReason}
                              </span>
                            </div>
                          )}

                          <div className="flex items-start gap-2">
                            {isUrgent && (
                              <div className="w-2 h-2 bg-rose-500 rounded-full mt-1.5 flex-shrink-0 animate-ping" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm leading-snug text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                                {tip.title}
                              </h4>
                              {tip.summary && (
                                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed font-normal">
                                  {tip.summary}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 text-xs flex-wrap">
                          <Badge variant="outline" className="text-[10px] rounded-lg border-slate-200 bg-white text-slate-700 font-medium">
                            {tip.category}
                          </Badge>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {readTime}
                          </span>
                          <span className="text-[11px] text-emerald-600 font-semibold ml-auto flex items-center group-hover:translate-x-0.5 transition-transform">
                            Lire <ChevronRight className="w-3 h-3 ml-0.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <Button 
                onClick={() => onNavigateTab?.('health-tips')}
                variant="outline" 
                className="w-full mt-4 rounded-2xl text-slate-800 border-slate-200 hover:bg-slate-900 hover:text-white transition-all font-medium flex items-center justify-center gap-1.5 text-xs h-10"
              >
                <BookOpen className="w-4 h-4" />
                Voir tous les conseils de santé
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Identity, Insurance & Local Healthcare Services) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Emergency Medical Booklet & QR Card */}
          <Card className="rounded-3xl border-rose-200 bg-gradient-to-br from-rose-950 via-slate-900 to-indigo-950 text-white shadow-md overflow-hidden relative">
            <div className="absolute right-0 top-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="pb-2 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black shadow-xs">
                    <HeartPulse className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-white leading-tight">
                      Carnet de Santé & QR
                    </CardTitle>
                    <p className="text-[10px] text-rose-200">Profil médical & Secours d'urgence</p>
                  </div>
                </div>
                <Badge className={booklet.bloodGroup || user?.bloodGroup ? 'bg-rose-500 text-white text-[10px] font-bold rounded-full' : 'bg-amber-400 text-slate-950 text-[10px] font-bold rounded-full'}>
                  {booklet.bloodGroup || user?.bloodGroup ? `Groupe ${booklet.bloodGroup || user?.bloodGroup}` : 'À configurer'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2 py-1">
                <div className="bg-white/10 rounded-xl p-2 text-center">
                  <div className="text-[10px] text-rose-300 uppercase font-semibold">Groupe</div>
                  <div className="font-extrabold text-sm text-white">{booklet.bloodGroup || user?.bloodGroup || '—'}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-2 text-center">
                  <div className="text-[10px] text-rose-300 uppercase font-semibold">Génotype</div>
                  <div className="font-extrabold text-sm text-yellow-300">{booklet.genotype || '—'}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-2 text-center">
                  <div className="text-[10px] text-rose-300 uppercase font-semibold">Allergies</div>
                  <div className="font-extrabold text-sm text-white">
                    {booklet.detailedAllergies?.length || (Array.isArray(user?.allergies) ? user.allergies.length : 0)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  onClick={() => onNavigateTab ? onNavigateTab('booklet') : undefined}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold h-9 shadow-sm"
                >
                  <QrCode className="w-3.5 h-3.5 mr-1.5" />
                  Carnet & QR
                </Button>
                <Button
                  onClick={() => onNavigateTab ? onNavigateTab('prescriptions') : undefined}
                  className="flex-1 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-xs font-bold h-9 border border-white/20"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Ordonnances
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CSU Universal Health Coverage Card */}
          <Card className="rounded-3xl border-emerald-300 bg-gradient-to-br from-emerald-900 to-teal-950 text-white shadow-md overflow-hidden relative">
            <div className="absolute right-0 top-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="pb-2 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-yellow-400 text-slate-900 flex items-center justify-center font-black shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-emerald-900" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-white leading-tight">
                      CSU-CM • MINSANTÉ
                    </CardTitle>
                    <p className="text-[10px] text-emerald-200">Couverture Santé Universelle</p>
                  </div>
                </div>
                <Badge className={isCsuLinked ? 'bg-emerald-500 text-white text-[10px] font-bold rounded-full' : 'bg-yellow-400 text-slate-950 text-[10px] font-bold rounded-full'}>
                  {isCsuLinked ? 'Verified' : 'Card Not Linked'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {isCsuLinked ? (
                <>
                  <div className="space-y-1">
                    <div className="text-[10px] text-emerald-300 uppercase font-semibold">Matricule Bénéficiaire</div>
                    <div className="font-mono text-xs sm:text-sm font-bold text-yellow-300 bg-white/10 px-2.5 py-1 rounded-xl inline-block">
                      {csu.matricule}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-emerald-100 pt-1">
                    <span className="truncate max-w-[170px]">{csu.beneficiaryCategory || 'Régime Général'}</span>
                    <span className="font-extrabold text-white bg-emerald-700/60 px-2 py-0.5 rounded-lg border border-emerald-500/40">
                      {csu.coverageRate || 70}% Cover
                    </span>
                  </div>
                  <Button
                    onClick={() => onNavigateTab ? onNavigateTab('csu') : setIsProfileOpen(true)}
                    className="w-full bg-white text-emerald-950 hover:bg-emerald-50 rounded-2xl text-xs font-bold h-9 mt-1"
                  >
                    View Digital Health Card
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-emerald-100 leading-relaxed">
                    Link your CSU matricule to enjoy up to 100% price shielding on essential medications at registered Cameroonian pharmacies.
                  </p>
                  <Button
                    onClick={() => onNavigateTab ? onNavigateTab('csu') : setIsProfileOpen(true)}
                    className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 rounded-2xl text-xs font-black h-9 shadow-md"
                  >
                    Link CSU Card Now
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Nearby Pharmacies */}
          <Card className="rounded-3xl border-slate-200/90 shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Store className="w-5 h-5 text-emerald-600" />
                  Nearby Pharmacies
                </CardTitle>
                <Badge variant="outline" className="text-[11px] rounded-lg border-emerald-200 text-emerald-700 bg-emerald-50 font-medium">
                  De garde
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              {isPharmaciesLoading ? (
                <div className="text-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
                </div>
              ) : (
                <div className="space-y-2.5">
                  {nearbyPharmacies.slice(0, 3).map((pharmacy, index) => (
                    <div key={index} className="p-3 border rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <h4 className="font-semibold text-xs sm:text-sm text-slate-900 leading-tight">{pharmacy.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {pharmacy.distance}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-bold text-slate-800">{pharmacy.rating}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-1">
                        <Badge className={pharmacy.open ? 'bg-emerald-600 text-white rounded-xl text-[10px]' : 'bg-slate-500 text-white rounded-xl text-[10px]'}>
                          {pharmacy.open ? 'Open 24/7' : 'Closed'}
                        </Badge>
                        <Button size="sm" variant="outline" className="rounded-xl text-slate-800 text-[11px] h-7 px-2.5 hover:bg-emerald-600 hover:text-white transition-colors">
                          <Phone className="w-3 h-3 mr-1" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button 
                onClick={() => onNavigateTab ? onNavigateTab('pharmacies') : undefined}
                variant="outline" 
                className="w-full mt-3 rounded-2xl text-slate-800 text-xs font-medium h-9 hover:bg-slate-900 hover:text-white transition-colors"
              >
                View All Pharmacies
              </Button>
            </CardContent>
          </Card>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <Card className="rounded-3xl border-slate-200/90 shadow-sm overflow-hidden bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Recent Searches
                  </CardTitle>
                  <span className="text-[11px] text-slate-400">{recentSearches.length} items</span>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="space-y-2">
                  {recentSearches.slice(0, 4).map((search, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <Pill className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-slate-900 truncate">{search.medicine}</p>
                          <p className="text-[10px] text-muted-foreground">{formatTimeAgo(search.timestamp)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge
                          className={`text-[9px] px-2 py-0.5 rounded-lg ${
                            search.found ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}
                        >
                          {search.found ? 'Available' : 'Not Found'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSearch(search.timestamp)}
                          className="h-6 w-6 rounded-full hover:bg-rose-100 hover:text-rose-600 text-slate-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Personalized Health Tip Detail Dialog */}
      <Dialog open={!!selectedTip} onOpenChange={(open) => !open && setSelectedTip(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 border-slate-200 shadow-2xl">
          {selectedTip && (
            <>
              <DialogHeader className="text-left space-y-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedTip.matchReason && (
                    <Badge className={`text-xs font-semibold px-2.5 py-1 ${
                      selectedTip.matchReason?.toLowerCase().includes('allergie') || selectedTip.matchReason?.toLowerCase().includes('alerte')
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      {selectedTip.matchReason}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50 font-medium">
                    Validation Officielle MINSANTÉ
                  </Badge>
                  <Badge variant="outline" className="text-xs text-slate-600">
                    {selectedTip.category}
                  </Badge>
                </div>
                <DialogTitle className="text-xl font-bold text-slate-900 leading-snug pt-1">
                  {selectedTip.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Temps de lecture estimé : {selectedTip.readTime || '2 min'} • Source : Ministère de la Santé Publique
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {selectedTip.isPersonalized && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 flex items-start gap-2.5 text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-900">Conseil adapté à vos antécédents médicaux</p>
                      <p className="text-emerald-800/90 mt-0.5 leading-relaxed">
                        Ce conseil a été automatiquement sélectionné pour vous en croisant les données cliniques de votre carnet de santé (maladies chroniques, allergies, posologies).
                      </p>
                    </div>
                  </div>
                )}

                {selectedTip.summary && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium leading-relaxed">
                    {selectedTip.summary}
                  </div>
                )}

                <div className="text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line font-normal">
                  {selectedTip.content}
                </div>

                {Array.isArray(selectedTip.tags) && selectedTip.tags.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] font-medium text-slate-400 mr-1">Mots-clés :</span>
                    {selectedTip.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between sm:justify-between w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTip(null);
                    onNavigateTab?.('health-tips');
                  }}
                  className="rounded-xl text-xs"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                  Tous les conseils
                </Button>
                <Button
                  onClick={() => setSelectedTip(null)}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs px-4"
                >
                  J'ai compris
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}