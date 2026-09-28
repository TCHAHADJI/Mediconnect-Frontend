import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { 
  Clock, 
  Moon, 
  Sun, 
  DoorClosed, 
  Calendar, 
  Phone, 
  UserCheck, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  AlertCircle,
  Radio,
  CheckCircle2,
  Bell,
  ArrowRight,
  Info
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';

interface RotationItem {
  id: string;
  title: string;
  type: 'WEEKEND' | 'HOLIDAY' | 'NIGHT_EMERGENCY';
  startDate: string;
  endDate: string;
  dutyStaff: string;
  contactPhone: string;
  notes: string;
  status: 'SCHEDULED' | 'CONFIRMED_ONPC' | 'COMPLETED';
}

interface NightDutyConfig {
  enabled: boolean;
  startTime: string;
  endTime: string;
  onCallPhone: string;
  dutyPharmacistName: string;
  emergencyInstructions: string;
  is24Hours: boolean;
}

export function DutyScheduleManager() {
  const [realTimeStatus, setRealTimeStatus] = useState<'OPEN' | 'ON_DUTY' | 'CLOSED'>('OPEN');
  const [nightDuty, setNightDuty] = useState<NightDutyConfig>({
    enabled: false,
    startTime: '20:00',
    endTime: '08:00',
    onCallPhone: '',
    dutyPharmacistName: '',
    emergencyInstructions: "Sonnette de nuit disponible au guichet d'urgence.",
    is24Hours: false,
  });
  const [rotations, setRotations] = useState<RotationItem[]>([]);
  const [pharmacyName, setPharmacyName] = useState<string>('Your Pharmacy');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [lastStatusUpdate, setLastStatusUpdate] = useState<string>('');

  // Add rotation modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'WEEKEND' | 'HOLIDAY' | 'NIGHT_EMERGENCY'>('WEEKEND');
  const [newStartDate, setNewStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newEndDate, setNewEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newStaff, setNewStaff] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');

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

  // Fetch duty schedule on mount
  useEffect(() => {
    fetchDutySchedule();
  }, []);

  const fetchDutySchedule = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/pharmacy/duty-schedule`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const res = await response.json();
      if (res.success && res.data) {
        setPharmacyName(res.data.pharmacyName || 'Pharmacy');
        setRealTimeStatus(res.data.realTimeStatus || (res.data.isOnDuty ? 'ON_DUTY' : 'OPEN'));
        if (res.data.dutySchedule) {
          if (res.data.dutySchedule.nightDuty) {
            setNightDuty(res.data.dutySchedule.nightDuty);
          }
          if (Array.isArray(res.data.dutySchedule.rotations)) {
            setRotations(res.data.dutySchedule.rotations);
          }
          if (res.data.dutySchedule.lastStatusUpdate) {
            setLastStatusUpdate(new Date(res.data.dutySchedule.lastStatusUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch duty schedule:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fast toggle real-time status
  const handleStatusChange = async (newStatus: 'OPEN' | 'ON_DUTY' | 'CLOSED') => {
    if (newStatus === realTimeStatus) return;
    setIsTogglingStatus(true);
    const token = getAuthToken();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/pharmacy/realtime-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const res = await response.json();
      if (res.success) {
        setRealTimeStatus(newStatus);
        setLastStatusUpdate(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        const statusLabel = 
          newStatus === 'ON_DUTY' ? 'Pharmacie de Garde (Active / 24h & Nuit)' :
          newStatus === 'OPEN' ? 'Ouvert (Heures Normales)' : 'Fermé (Hors Service)';
        toast.success(`Statut mis à jour en direct: ${statusLabel}`);
      } else {
        toast.error(res.message || 'Failed to update status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error updating status');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Save Night Duty Configuration
  const handleSaveNightDuty = async () => {
    setIsSaving(true);
    const token = getAuthToken();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/pharmacy/duty-schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nightDuty,
          rotations,
          realTimeStatus
        })
      });
      const res = await response.json();
      if (res.success) {
        toast.success('Horaires de garde de nuit et protocoles enregistrés avec succès!');
      } else {
        toast.error(res.message || 'Failed to save duty configuration');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error saving duty schedule');
    } finally {
      setIsSaving(false);
    }
  };

  // Add Rotation Shift
  const handleAddRotation = () => {
    if (!newTitle.trim()) {
      toast.error('Veuillez spécifier le titre de la rotation de garde.');
      return;
    }
    const newEntry: RotationItem = {
      id: `ROT-${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      startDate: newStartDate,
      endDate: newEndDate || newStartDate,
      dutyStaff: newStaff.trim() || 'Pharmacien de garde',
      contactPhone: newPhone.trim() || nightDuty.onCallPhone,
      notes: newNotes.trim(),
      status: 'CONFIRMED_ONPC'
    };
    const updated = [newEntry, ...rotations];
    setRotations(updated);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewStaff('');
    setNewNotes('');
    toast.success('Période de rotation ajoutée au calendrier!');
    // Trigger auto-save
    saveRotationsToServer(updated);
  };

  const handleDeleteRotation = (id: string) => {
    const updated = rotations.filter(r => r.id !== id);
    setRotations(updated);
    toast.info('Rotation retirée.');
    saveRotationsToServer(updated);
  };

  const saveRotationsToServer = async (updatedRotations: RotationItem[]) => {
    const token = getAuthToken();
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/pharmacy/duty-schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nightDuty,
          rotations: updatedRotations,
          realTimeStatus
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Pre-load Cameroon Holiday Preset
  const applyCameroonHolidayPreset = (title: string, date: string) => {
    setNewTitle(title);
    setNewType('HOLIDAY');
    setNewStartDate(date);
    setNewEndDate(date);
    setNewNotes(`Garde obligatoire jour férié officiel MINSANTÉ / ONPC.`);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Gestion Pharmacie de Garde & Rotation ONPC</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Duty Schedule & Real-Time Opening Status
            </h1>
            <p className="text-emerald-100 text-sm max-w-2xl">
              Configure night duty hours, assign weekend & holiday rotations, and broadcast live opening status to Cameroon patients and emergency callers in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/25 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className={`w-3 h-3 rounded-full ${
                  realTimeStatus === 'ON_DUTY' ? 'bg-emerald-400 animate-ping' :
                  realTimeStatus === 'OPEN' ? 'bg-blue-400' : 'bg-rose-400'
                }`} />
                <span className={`absolute w-3 h-3 rounded-full ${
                  realTimeStatus === 'ON_DUTY' ? 'bg-emerald-400' :
                  realTimeStatus === 'OPEN' ? 'bg-blue-400' : 'bg-rose-400'
                }`} />
              </div>
              <div>
                <div className="text-[10px] text-white/70 uppercase font-semibold">Current Live Status</div>
                <div className="text-sm font-bold tracking-wide">
                  {realTimeStatus === 'ON_DUTY' ? 'PHARMACIE DE GARDE' :
                   realTimeStatus === 'OPEN' ? 'OUVERT (NORMAL)' : 'FERMÉ (HORS SERVICE)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Real-Time Opening Status Switcher Card */}
      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                  Real-Time Opening Broadcast
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Click to switch status immediately. Updates the public map, emergency searches, and patient directories instantly.
                </CardDescription>
              </div>
            </div>
            {lastStatusUpdate && (
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Last updated today at {lastStatusUpdate}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status 1: OPEN */}
            <div
              onClick={() => !isTogglingStatus && handleStatusChange('OPEN')}
              className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 flex flex-col justify-between ${
                realTimeStatus === 'OPEN'
                  ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400">
                  <Sun className="w-6 h-6" />
                </div>
                {realTimeStatus === 'OPEN' ? (
                  <Badge className="bg-blue-600 text-white font-semibold">Active Live</Badge>
                ) : (
                  <span className="text-xs text-slate-400">Click to switch</span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Ouvert / Open</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Operating regular retail business hours. Standard walk-in prescriptions and customer consultation.
                </p>
              </div>
            </div>

            {/* Status 2: ON DUTY (DE GARDE) */}
            <div
              onClick={() => !isTogglingStatus && handleStatusChange('ON_DUTY')}
              className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                realTimeStatus === 'ON_DUTY'
                  ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/50 shadow-lg ring-2 ring-emerald-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 bg-white dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Moon className="w-6 h-6" />
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                {realTimeStatus === 'ON_DUTY' ? (
                  <Badge className="bg-emerald-600 text-white font-bold tracking-wide animate-pulse">
                    ON DUTY (DE GARDE)
                  </Badge>
                ) : (
                  <span className="text-xs text-emerald-600 font-semibold">Activate Guard</span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                  Pharmacie de Garde / On-Duty
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Official ONPC night & emergency permanence. Broadcasts green duty glow, emergency contact line, and night hatch ringing instructions to patients.
                </p>
              </div>
            </div>

            {/* Status 3: CLOSED */}
            <div
              onClick={() => !isTogglingStatus && handleStatusChange('CLOSED')}
              className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 flex flex-col justify-between ${
                realTimeStatus === 'CLOSED'
                  ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 shadow-md ring-2 ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400">
                  <DoorClosed className="w-6 h-6" />
                </div>
                {realTimeStatus === 'CLOSED' ? (
                  <Badge className="bg-rose-600 text-white font-semibold">Active Live</Badge>
                ) : (
                  <span className="text-xs text-slate-400">Click to switch</span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Fermé / Closed</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Closed for the night or break. Informs patients of upcoming opening hours and redirects urgent cases to the nearest on-duty pharmacy.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: 2. Night Duty Hours & Protocols (Left) + 3. Weekend/Holiday Rotations (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Night Duty Configuration (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                    Night Duty Hours & Protocol
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Define shift hours, night pharmacist in charge, and emergency hatch access.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              {/* Continuous 24h Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    24/7 Continuous Night Service
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Open non-stop throughout the entire night without interruption.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={nightDuty.is24Hours}
                  onChange={(e) => setNightDuty({ ...nightDuty, is24Hours: e.target.checked })}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Start & End Times */}
              {!nightDuty.is24Hours && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Night Shift Starts (Heure Début)
                    </Label>
                    <Input
                      type="time"
                      value={nightDuty.startTime}
                      onChange={(e) => setNightDuty({ ...nightDuty, startTime: e.target.value })}
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Night Shift Ends (Heure Fin)
                    </Label>
                    <Input
                      type="time"
                      value={nightDuty.endTime}
                      onChange={(e) => setNightDuty({ ...nightDuty, endTime: e.target.value })}
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* On-Call Duty Pharmacist */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                  Duty Pharmacist in Charge (Pharmacien de Garde)
                </Label>
                <Input
                  placeholder="e.g. Dr. Jean-Marc Mbarga"
                  value={nightDuty.dutyPharmacistName}
                  onChange={(e) => setNightDuty({ ...nightDuty, dutyPharmacistName: e.target.value })}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>

              {/* Emergency Call Phone */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  Night Emergency Phone (Numéro d'Urgence Nuit)
                </Label>
                <Input
                  placeholder="e.g. +237 670 00 11 22"
                  value={nightDuty.onCallPhone}
                  onChange={(e) => setNightDuty({ ...nightDuty, onCallPhone: e.target.value })}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              {/* Emergency Hatch Instructions */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  Night Hatch & Bell Instructions (Consignes Guichet)
                </Label>
                <textarea
                  rows={3}
                  value={nightDuty.emergencyInstructions}
                  onChange={(e) => setNightDuty({ ...nightDuty, emergencyInstructions: e.target.value })}
                  placeholder="Sonnette de nuit disponible au guichet d'urgence à gauche..."
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveNightDuty}
                disabled={isSaving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-md h-11"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving Night Protocols...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Night Duty Configuration
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Weekends & Holidays Rotation Roster (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                      Weekends & Holidays Rotation Roster
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                      Roster of official duty rotations accredited by the Ordre National des Pharmaciens (ONPC).
                    </CardDescription>
                  </div>
                </div>

                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm h-9 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  Assign Rotation Shift
                </Button>
              </div>

              {/* Cameroon Official Holiday Presets */}
              <div className="pt-3 flex items-center gap-2 overflow-x-auto text-xs pb-1">
                <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                  Cameroon Presets:
                </span>
                <button
                  type="button"
                  onClick={() => applyCameroonHolidayPreset('Fête Nationale du Cameroun (20 Mai)', `${new Date().getFullYear()}-05-20`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  🇨🇲 20 Mai (Fête Nat.)
                </button>
                <button
                  type="button"
                  onClick={() => applyCameroonHolidayPreset('Fête du Travail (1er Mai)', `${new Date().getFullYear()}-05-01`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  🛠️ 1er Mai (Travail)
                </button>
                <button
                  type="button"
                  onClick={() => applyCameroonHolidayPreset('Fête de la Jeunesse (11 Février)', `${new Date().getFullYear()}-02-11`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  🎓 11 Février (Jeunesse)
                </button>
                <button
                  type="button"
                  onClick={() => applyCameroonHolidayPreset('Noël / Fin d\'Année', `${new Date().getFullYear()}-12-25`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  🎄 25 Décembre (Noël)
                </button>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {rotations.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">No scheduled rotations yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Add upcoming weekend guard shifts or public holiday rotations to keep your pharmacy compliant with the regional duty calendar.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs"
                  >
                    Assign First Shift
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rotations.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {item.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              item.type === 'HOLIDAY'
                                ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                : item.type === 'WEEKEND'
                                ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                                : 'border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                            }`}
                          >
                            {item.type === 'HOLIDAY' ? 'Jour Férié' : item.type === 'WEEKEND' ? 'Weekend Duty' : 'Garde Nuit'}
                          </Badge>
                          <Badge className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] border border-emerald-300 dark:border-emerald-800">
                            ONPC Homologated
                          </Badge>
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3 flex-wrap">
                          <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            {item.startDate === item.endDate ? item.startDate : `${item.startDate} → ${item.endDate}`}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            {item.dutyStaff}
                          </span>
                          {item.contactPhone && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                <Phone className="w-3 h-3 text-emerald-500" />
                                {item.contactPhone}
                              </span>
                            </>
                          )}
                        </div>

                        {item.notes && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                            {item.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {realTimeStatus !== 'ON_DUTY' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange('ON_DUTY')}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-8 px-3 font-semibold shadow-sm"
                          >
                            Activate Now
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRotation(item.id)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Rotation Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:max-w-lg">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Assign Duty Rotation Shift</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Assign upcoming weekend or holiday duty rotation accredited by ONPC.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Rotation Title *</Label>
              <Input
                placeholder="e.g. Rotation Garde Weekend - Centre Urbain"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Shift Type</Label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="WEEKEND">Weekend Duty (Samedi-Dimanche)</option>
                  <option value="HOLIDAY">Public Holiday (Jour Férié)</option>
                  <option value="NIGHT_EMERGENCY">Night Emergency Only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Start Date *</Label>
                <Input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">End Date *</Label>
                <Input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Assigned Staff</Label>
                <Input
                  placeholder="e.g. Dr. Jean-Marc Mbarga"
                  value={newStaff}
                  onChange={(e) => setNewStaff(e.target.value)}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Contact Emergency Phone</Label>
              <Input
                placeholder="e.g. +237 670 12 34 56"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes / Shift Instructions</Label>
              <Input
                placeholder="e.g. Guichet de nuit et approvisionnement urgence..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddRotation}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
            >
              Add to Duty Roster
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
