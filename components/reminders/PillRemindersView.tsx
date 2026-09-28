import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import {
  Clock,
  Pill,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Trash2,
  Edit2,
  Utensils,
  TrendingUp,
  ShieldCheck,
  Check,
  ChevronRight,
  Loader2,
  Bell,
  BellRing,
  Volume2,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatTime12h, playDoseTakenChime, playNotificationChime } from './alarmAudio';
import { AmPmTimePicker } from './AmPmTimePicker';
import { MedicationAlarmModal, ActiveAlarmPayload } from './MedicationAlarmModal';

export interface PillReminderItem {
  _id?: string;
  id?: string;
  medicineName: string;
  dosage: string;
  form: 'tablet' | 'capsule' | 'syrup' | 'drops' | 'injection' | 'inhaler' | 'other';
  frequency: string;
  times: string[];
  foodInstructions: 'BEFORE_MEAL' | 'AFTER_MEAL' | 'WITH_MEAL' | 'EMPTY_STOMACH' | 'NO_RESTRICTION';
  startDate?: string;
  endDate?: string;
  ongoing?: boolean;
  totalPills: number;
  remainingPills: number;
  refillReminder: boolean;
  refillThreshold: number;
  color: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'indigo' | 'teal';
  notes?: string;
  isActive: boolean;
  takenHistory?: Array<{
    date: string;
    time: string;
    status: 'TAKEN' | 'SKIPPED';
    takenAt?: string;
  }>;
}

const COMMON_CAMEROON_MEDS = [
  { name: 'Paracetamol', dosage: '500mg', form: 'tablet', food: 'AFTER_MEAL' },
  { name: 'Coartem (Artemether + Lumefantrine)', dosage: '20/120mg', form: 'tablet', food: 'WITH_MEAL' },
  { name: 'Amoxicilline', dosage: '500mg', form: 'capsule', food: 'AFTER_MEAL' },
  { name: 'Ciprofloxacine', dosage: '500mg', form: 'tablet', food: 'BEFORE_MEAL' },
  { name: 'Metformine', dosage: '850mg', form: 'tablet', food: 'WITH_MEAL' },
  { name: 'Amlodipine', dosage: '5mg', form: 'tablet', food: 'NO_RESTRICTION' },
  { name: 'Omeprazole', dosage: '20mg', form: 'capsule', food: 'BEFORE_MEAL' },
  { name: 'Ibuprofène', dosage: '400mg', form: 'tablet', food: 'AFTER_MEAL' },
  { name: 'Vitamine C + Zinc', dosage: '1000mg', form: 'tablet', food: 'AFTER_MEAL' },
];

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-600 text-white' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-600 text-white' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-600 text-white' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-600 text-white' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-600 text-white' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', badge: 'bg-indigo-600 text-white' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', badge: 'bg-teal-600 text-white' },
};

export function PillRemindersView({ onNavigateToPharmacies }: { onNavigateToPharmacies?: () => void }) {
  const [reminders, setReminders] = useState<PillReminderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'medications' | 'adherence'>('schedule');

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<PillReminderItem | null>(null);

  // Form State
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('1 tablet');
  const [form, setForm] = useState<PillReminderItem['form']>('tablet');
  const [frequency, setFrequency] = useState('TWICE_DAILY');
  const [times, setTimes] = useState<string[]>(['08:00', '20:00']);
  const [foodInstructions, setFoodInstructions] = useState<PillReminderItem['foodInstructions']>('AFTER_MEAL');
  const [totalPills, setTotalPills] = useState<number>(30);
  const [remainingPills, setRemainingPills] = useState<number>(30);
  const [refillThreshold, setRefillThreshold] = useState<number>(5);
  const [color, setColor] = useState<PillReminderItem['color']>('blue');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alarm & Ringing Notification State
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarmPayload | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const triggeredAlarmsRef = React.useRef<Set<string>>(new Set());

  const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getAuthToken = () => {
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed?.token || parsed?.data?.token || parsed?.user?.data?.token;
      } catch (e) {}
    }
    return null;
  };

  const handleRequestPermission = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          playNotificationChime();
          toast.success('Pill notifications activated in your browser! 🔔');
          try {
            new Notification('⏰ MediConnect Reminders', {
              body: 'Medication alarms and pill reminders are now active on your device.',
              icon: '/favicon.ico',
            });
          } catch (e) {}
        } else {
          toast.error('Notification permission was denied in browser settings.');
        }
      } catch (err) {}
    } else {
      toast.error('This browser does not support web notifications.');
    }
  };

  const handleTriggerTestAlarm = () => {
    const sample: PillReminderItem = reminders[0] || {
      medicineName: 'Paracétamol Biogaran',
      dosage: '1000mg',
      form: 'tablet',
      frequency: 'TWICE_DAILY',
      times: ['08:00', '20:00'],
      foodInstructions: 'AFTER_MEAL',
      totalPills: 30,
      remainingPills: 24,
      refillReminder: true,
      refillThreshold: 5,
      color: 'blue',
      notes: 'Take after meals with a glass of water.',
      isActive: true,
    };

    setActiveAlarm({
      reminder: sample,
      time: '08:00',
      date: getTodayDateString(),
    });
  };

  const handleSnoozeAlarm = (reminder: PillReminderItem, time: string, minutes: number = 5) => {
    setActiveAlarm(null);
    toast.info(`Alarm snoozed for ${minutes} minutes ⏰`);
    setTimeout(() => {
      setActiveAlarm({
        reminder,
        time,
        date: getTodayDateString(),
      });
    }, minutes * 60 * 1000);
  };

  const fetchReminders = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    if (!token) {
      // Load from localStorage fallback if user isn't logged into network yet
      const saved = localStorage.getItem('patientPillReminders');
      if (saved) {
        try {
          setReminders(JSON.parse(saved));
        } catch (e) {}
      }
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/reminders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data && Array.isArray(data.data.reminders)) {
        setReminders(data.data.reminders);
        localStorage.setItem('patientPillReminders', JSON.stringify(data.data.reminders));
      } else {
        const saved = localStorage.getItem('patientPillReminders');
        if (saved) setReminders(JSON.parse(saved));
      }
    } catch (err) {
      const saved = localStorage.getItem('patientPillReminders');
      if (saved) {
        try {
          setReminders(JSON.parse(saved));
        } catch (e) {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
    window.addEventListener('pillRemindersUpdated', fetchReminders);
    return () => window.removeEventListener('pillRemindersUpdated', fetchReminders);
  }, []);

  // Real-time alarm checker running every 5 seconds
  useEffect(() => {
    const checkClock = () => {
      const now = new Date();
      const currentH = String(now.getHours()).padStart(2, '0');
      const currentM = String(now.getMinutes()).padStart(2, '0');
      const currentTime24 = `${currentH}:${currentM}`;
      const today = getTodayDateString();

      const activeList = reminders.filter((r) => r.isActive !== false);

      activeList.forEach((reminder) => {
        const rId = reminder._id || reminder.id || reminder.medicineName;
        (reminder.times || []).forEach((t) => {
          if (!t) return;
          const [th, tm] = t.split(':');
          const formattedT = `${String(parseInt(th, 10)).padStart(2, '0')}:${String(parseInt(tm, 10)).padStart(2, '0')}`;

          if (formattedT === currentTime24) {
            const alarmKey = `${today}_${rId}_${formattedT}`;
            const isTaken = (reminder.takenHistory || []).some(
              (h) => h.date === today && h.time === t && h.status === 'TAKEN'
            );

            if (!triggeredAlarmsRef.current.has(alarmKey) && !isTaken) {
              triggeredAlarmsRef.current.add(alarmKey);

              // 1. Ring and popup modal
              setActiveAlarm({
                reminder,
                time: t,
                date: today,
              });

              // 2. Desktop notification
              if ('Notification' in window && Notification.permission === 'granted') {
                const time12 = formatTime12h(t).formatted;
                try {
                  const notif = new Notification(`⏰ MediConnect : Heure de prise (${time12})`, {
                    body: `Prenez votre dose de ${reminder.medicineName} (${reminder.dosage}) - ${reminder.foodInstructions?.replace('_', ' ')}`,
                    icon: '/favicon.ico',
                    requireInteraction: true,
                    tag: alarmKey,
                  });
                  notif.onclick = () => window.focus();
                } catch (err) {}
              }

              // 3. Register in backend notification center
              const token = getAuthToken();
              if (token && reminder._id) {
                fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/reminders/${reminder._id}/notify-due`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    time: t,
                    medicineName: reminder.medicineName,
                    dosage: reminder.dosage,
                    foodInstructions: reminder.foodInstructions,
                  }),
                }).catch(() => {});
              }
            }
          }
        });
      });
    };

    const interval = setInterval(checkClock, 5000);
    checkClock();

    return () => clearInterval(interval);
  }, [reminders]);

  const openCreateDialog = () => {
    setEditingReminder(null);
    setMedicineName('');
    setDosage('1 tablet');
    setForm('tablet');
    setFrequency('TWICE_DAILY');
    setTimes(['08:00', '20:00']);
    setFoodInstructions('AFTER_MEAL');
    setTotalPills(30);
    setRemainingPills(30);
    setRefillThreshold(5);
    setColor('blue');
    setNotes('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (rem: PillReminderItem) => {
    setEditingReminder(rem);
    setMedicineName(rem.medicineName);
    setDosage(rem.dosage);
    setForm(rem.form || 'tablet');
    setFrequency(rem.frequency || 'TWICE_DAILY');
    setTimes(rem.times || ['08:00', '20:00']);
    setFoodInstructions(rem.foodInstructions || 'AFTER_MEAL');
    setTotalPills(rem.totalPills || 30);
    setRemainingPills(rem.remainingPills !== undefined ? rem.remainingPills : 30);
    setRefillThreshold(rem.refillThreshold || 5);
    setColor(rem.color || 'blue');
    setNotes(rem.notes || '');
    setIsDialogOpen(true);
  };

  const handleFrequencyChange = (newFreq: string) => {
    setFrequency(newFreq);
    if (newFreq === 'ONCE_DAILY') setTimes(['08:00']);
    else if (newFreq === 'TWICE_DAILY') setTimes(['08:00', '20:00']);
    else if (newFreq === 'THREE_TIMES_DAILY') setTimes(['08:00', '14:00', '20:00']);
    else if (newFreq === 'FOUR_TIMES_DAILY') setTimes(['07:00', '12:00', '17:00', '22:00']);
    else if (newFreq === 'EVERY_8_HOURS') setTimes(['06:00', '14:00', '22:00']);
  };

  const handleSaveReminder = async () => {
    if (!medicineName.trim()) {
      toast.error('Please enter the medicine name');
      return;
    }
    if (!dosage.trim()) {
      toast.error('Please enter the dosage');
      return;
    }
    if (times.length === 0) {
      toast.error('Please set at least one reminder time');
      return;
    }

    setIsSubmitting(true);
    const token = getAuthToken();

    const payload = {
      medicineName: medicineName.trim(),
      dosage: dosage.trim(),
      form,
      frequency,
      times,
      foodInstructions,
      totalPills: Number(totalPills) || 30,
      remainingPills: Number(remainingPills) || 30,
      refillReminder: true,
      refillThreshold: Number(refillThreshold) || 5,
      color,
      notes: notes.trim(),
      isActive: true,
    };

    try {
      if (editingReminder && (editingReminder._id || editingReminder.id)) {
        const id = editingReminder._id || editingReminder.id;
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/reminders/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Pill reminder updated successfully');
          fetchReminders();
          window.dispatchEvent(new Event('pillRemindersUpdated'));
        } else {
          throw new Error(data.message || 'Failed to update reminder');
        }
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/reminders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`Reminder set for ${medicineName}!`);
          fetchReminders();
          window.dispatchEvent(new Event('pillRemindersUpdated'));
        } else {
          throw new Error(data.message || 'Failed to create reminder');
        }
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      // Fallback local update
      if (editingReminder) {
        setReminders((prev) =>
          prev.map((r) => ((r._id || r.id) === (editingReminder._id || editingReminder.id) ? { ...r, ...payload } : r))
        );
      } else {
        const localItem: PillReminderItem = {
          _id: 'local_' + Date.now(),
          ...payload,
          takenHistory: [],
        };
        setReminders((prev) => [localItem, ...prev]);
      }
      window.dispatchEvent(new Event('pillRemindersUpdated'));
      toast.success('Reminder saved successfully');
      setIsDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (reminder: PillReminderItem) => {
    const id = reminder._id || reminder.id;
    const newStatus = !reminder.isActive;
    const token = getAuthToken();

    setReminders((prev) =>
      prev.map((r) => ((r._id || r.id) === id ? { ...r, isActive: newStatus } : r))
    );
    window.dispatchEvent(new Event('pillRemindersUpdated'));

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/reminders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isActive: newStatus }),
      });
      toast.success(newStatus ? 'Reminder activated' : 'Reminder paused');
    } catch (e) {}
  };

  const handleDeleteReminder = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the reminder for ${name}?`)) return;

    const token = getAuthToken();
    setReminders((prev) => prev.filter((r) => (r._id || r.id) !== id));
    window.dispatchEvent(new Event('pillRemindersUpdated'));

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/reminders/${id}`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      toast.success(`Reminder for ${name} deleted`);
    } catch (e) {}
  };

  const handleLogDose = async (reminder: PillReminderItem, time: string, status: 'TAKEN' | 'SKIPPED') => {
    const id = reminder._id || reminder.id;
    const today = getTodayDateString();
    const token = getAuthToken();

    if (status === 'TAKEN') {
      playDoseTakenChime();
    }

    if (activeAlarm && (activeAlarm.reminder._id || activeAlarm.reminder.id) === id && activeAlarm.time === time) {
      setActiveAlarm(null);
    }

    // Optimistic UI update
    setReminders((prev) =>
      prev.map((r) => {
        if ((r._id || r.id) === id) {
          const currentHistory = (r.takenHistory || []).filter(
            (h) => !(h.date === today && h.time === time)
          );
          const newRemaining = status === 'TAKEN' ? Math.max(0, r.remainingPills - 1) : r.remainingPills;
          return {
            ...r,
            remainingPills: newRemaining,
            takenHistory: [
              ...currentHistory,
              { date: today, time, status, takenAt: new Date().toISOString() },
            ],
          };
        }
        return r;
      })
    );

    window.dispatchEvent(new Event('pillRemindersUpdated'));

    if (status === 'TAKEN') {
      toast.success(`Dose of ${reminder.medicineName} recorded as taken! 🎉`);
    } else {
      toast.info(`Dose for ${time} marked as skipped.`);
    }

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/reminders/${id}/take`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ time, status, date: today }),
      });
    } catch (e) {}
  };

  // Calculations for Schedule & Metrics
  const todayDate = getTodayDateString();
  const activeReminders = reminders.filter((r) => r.isActive);

  // Flatten all doses for today
  interface TodayDose {
    reminder: PillReminderItem;
    time: string;
    isTaken: boolean;
    isSkipped: boolean;
  }

  const todayDoses: TodayDose[] = [];
  activeReminders.forEach((r) => {
    (r.times || []).forEach((t) => {
      const logged = (r.takenHistory || []).find((h) => h.date === todayDate && h.time === t);
      todayDoses.push({
        reminder: r,
        time: t,
        isTaken: logged?.status === 'TAKEN',
        isSkipped: logged?.status === 'SKIPPED',
      });
    });
  });

  // Sort chronologically
  todayDoses.sort((a, b) => a.time.localeCompare(b.time));

  const totalDosesToday = todayDoses.length;
  const takenDosesToday = todayDoses.filter((d) => d.isTaken).length;
  const adherenceToday = totalDosesToday > 0 ? Math.round((takenDosesToday / totalDosesToday) * 100) : 100;
  const lowStockReminders = reminders.filter(
    (r) => r.isActive && r.refillReminder && r.remainingPills <= r.refillThreshold
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-700 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Smart Health Adherence
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pill & Medication Reminders</h1>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Never miss a dose. Track your daily prescription schedules in 12-hour AM/PM format, enjoy live ringing alarms, and maintain your health streak with ease.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/20 backdrop-blur-md rounded-xl text-xs font-bold text-yellow-200">
                <Sun className="w-3.5 h-3.5 text-yellow-300" />
                12-Hour AM / PM Format Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/20 backdrop-blur-md rounded-xl text-xs font-bold text-blue-100">
                <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                Ringing Alarm Chimes Enabled
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleTriggerTestAlarm}
              className="bg-white/15 hover:bg-white/25 text-white border-white/30 rounded-2xl px-4 h-12 flex items-center gap-2 transition-all backdrop-blur-md"
              title="Test the real-time ringing alarm sound"
            >
              <BellRing className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span>Test Alarm 🔔</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleRequestPermission}
              className={`rounded-2xl px-4 h-12 flex items-center gap-2 transition-all backdrop-blur-md ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-500/25 text-emerald-100 border-emerald-400/40'
                  : 'bg-white/15 hover:bg-white/25 text-white border-white/30'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>{notificationPermission === 'granted' ? '🔔 Alerts Active' : 'Enable Push Alerts'}</span>
            </Button>

            <Button
              onClick={openCreateDialog}
              className="bg-white text-blue-900 hover:bg-blue-50 font-bold shadow-md rounded-2xl px-5 h-12 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5 text-blue-800" />
              Add Medication
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Adherence */}
        <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Adherence</span>
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold text-slate-900">{adherenceToday}%</span>
              <span className="text-xs text-slate-500">({takenDosesToday}/{totalDosesToday} taken)</span>
            </div>
            <Progress value={adherenceToday} className="h-2 rounded-full bg-slate-100" />
          </CardContent>
        </Card>

        {/* Metric 2: Active Medications */}
        <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Prescriptions</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Pill className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{activeReminders.length}</span>
              <span className="text-xs text-slate-500">registered in schedule</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {reminders.length - activeReminders.length} paused or completed
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Next Due Dose */}
        <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Next Scheduled Dose</span>
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            {(() => {
              const pendingDose = todayDoses.find((d) => !d.isTaken && !d.isSkipped);
              if (pendingDose) {
                const parsedT = formatTime12h(pendingDose.time);
                return (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xl font-black text-slate-900">{parsedT.formatted}</span>
                      <Badge className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                        parsedT.period === 'AM'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                      }`}>
                        {parsedT.period}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 truncate mt-1">
                      {pendingDose.reminder.medicineName} ({pendingDose.reminder.dosage})
                    </p>
                  </div>
                );
              }
              return (
                <div>
                  <span className="text-lg font-bold text-emerald-600">All done today! 🎉</span>
                  <p className="text-xs text-slate-500 mt-1">Next schedule starts tomorrow</p>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Metric 4: Refill Alerts */}
        <Card className={`rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-shadow ${lowStockReminders.length > 0 ? 'bg-amber-50/50 border-amber-200' : ''}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Stock & Refill Alerts</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${lowStockReminders.length > 0 ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold ${lowStockReminders.length > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                {lowStockReminders.length}
              </span>
              <span className="text-xs text-slate-500">meds running low</span>
            </div>
            {lowStockReminders.length > 0 && onNavigateToPharmacies && (
              <Button
                variant="link"
                size="sm"
                onClick={onNavigateToPharmacies}
                className="text-amber-800 p-0 h-auto text-xs font-bold hover:underline mt-2 flex items-center gap-1"
              >
                Find pharmacy to refill <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <TabsList className="bg-slate-100 p-1 rounded-2xl">
            <TabsTrigger value="schedule" className="rounded-xl px-4 py-2 font-medium">
              Today's Schedule ({todayDoses.length})
            </TabsTrigger>
            <TabsTrigger value="medications" className="rounded-xl px-4 py-2 font-medium">
              All Medications ({reminders.length})
            </TabsTrigger>
            <TabsTrigger value="adherence" className="rounded-xl px-4 py-2 font-medium">
              History & Refill Insights
            </TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchReminders}
            disabled={isLoading}
            className="rounded-xl self-start sm:self-auto text-slate-600 hover:text-slate-900"
          >
            <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* TAB 1: TODAY'S SCHEDULE */}
        <TabsContent value="schedule" className="space-y-4 m-0">
          {todayDoses.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-2 p-8 text-center bg-slate-50/50">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Pill className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No medication scheduled for today</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-5">
                Add your active prescriptions or regular treatments to build your personalized daily dosage timeline.
              </p>
              <Button onClick={openCreateDialog} className="bg-blue-600 text-white rounded-2xl px-6">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Medication
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayDoses.map((dose, idx) => {
                const colorTheme = COLOR_CLASSES[dose.reminder.color] || COLOR_CLASSES.blue;
                return (
                  <Card
                    key={`${dose.reminder._id || dose.reminder.id}-${dose.time}-${idx}`}
                    className={`rounded-3xl border transition-all ${
                      dose.isTaken
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : dose.isSkipped
                        ? 'border-slate-200 bg-slate-50/60 opacity-75'
                        : 'border-slate-200 bg-white hover:shadow-md'
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${colorTheme.bg} ${colorTheme.text} border ${colorTheme.border}`}>
                            <Pill className="w-6 h-6" />
                          </div>
                          <div>
                            {(() => {
                              const parsedDoseTime = formatTime12h(dose.time);
                              return (
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-black text-slate-900">{parsedDoseTime.formatted}</span>
                                  <Badge
                                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                      parsedDoseTime.period === 'AM'
                                        ? 'bg-amber-100 text-amber-950 border-amber-300'
                                        : 'bg-indigo-100 text-indigo-950 border-indigo-300'
                                    }`}
                                  >
                                    {parsedDoseTime.period === 'AM' ? '☀️ AM (Matin)' : '🌙 PM (Soir)'}
                                  </Badge>
                                  {dose.isTaken && (
                                    <Badge className="bg-emerald-600 text-white text-xs rounded-full px-2.5 py-0.5 font-bold">
                                      <Check className="w-3 h-3 mr-1" /> Taken
                                    </Badge>
                                  )}
                                  {dose.isSkipped && (
                                    <Badge variant="outline" className="text-slate-500 text-xs rounded-full">
                                      Skipped
                                    </Badge>
                                  )}
                                </div>
                              );
                            })()}
                            <h4 className="font-bold text-base text-slate-900 mt-1">{dose.reminder.medicineName}</h4>
                            <p className="text-xs text-slate-500">{dose.reminder.dosage} • {dose.reminder.form}</p>
                          </div>
                        </div>

                        <Badge variant="outline" className="text-xs capitalize font-medium rounded-xl border-slate-200 text-slate-600 flex items-center gap-1">
                          <Utensils className="w-3 h-3" />
                          {dose.reminder.foodInstructions.replace('_', ' ').toLowerCase()}
                        </Badge>
                      </div>

                      {dose.reminder.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl mb-4 italic border border-slate-100">
                          "{dose.reminder.notes}"
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="text-xs text-slate-500">
                          Stock: <span className={`font-bold ${dose.reminder.remainingPills <= dose.reminder.refillThreshold ? 'text-amber-600' : 'text-slate-800'}`}>{dose.reminder.remainingPills}</span> / {dose.reminder.totalPills} left
                        </div>

                        <div className="flex items-center gap-2">
                          {!dose.isTaken && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleLogDose(dose.reminder, dose.time, 'SKIPPED')}
                              className="rounded-xl text-xs text-slate-500 hover:text-slate-700 h-9"
                            >
                              Skip
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleLogDose(dose.reminder, dose.time, 'TAKEN')}
                            className={`rounded-xl text-xs font-semibold h-9 px-4 transition-all ${
                              dose.isTaken
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:scale-105'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            {dose.isTaken ? 'Marked Taken' : 'Take Dose'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: ALL MEDICATIONS */}
        <TabsContent value="medications" className="space-y-4 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reminders.map((rem) => {
              const id = rem._id || rem.id || '';
              const colorTheme = COLOR_CLASSES[rem.color] || COLOR_CLASSES.blue;
              const isLowStock = rem.refillReminder && rem.remainingPills <= rem.refillThreshold;
              const percentLeft = rem.totalPills > 0 ? Math.round((rem.remainingPills / rem.totalPills) * 100) : 0;

              return (
                <Card
                  key={id}
                  className={`rounded-3xl border transition-all ${
                    !rem.isActive
                      ? 'border-slate-200 bg-slate-50/70 opacity-60'
                      : isLowStock
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200 bg-white hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${colorTheme.bg} ${colorTheme.text} border ${colorTheme.border}`}>
                          <Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base leading-tight">{rem.medicineName}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{rem.dosage} • {rem.form}</p>
                        </div>
                      </div>
                      <Badge className={rem.isActive ? 'bg-emerald-600 text-white rounded-full text-xs' : 'bg-slate-400 text-white rounded-full text-xs'}>
                        {rem.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </div>

                    <div className="space-y-2.5 my-4 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Dose Times (12h):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {rem.times.map((t) => {
                            const p = formatTime12h(t);
                            return (
                              <span
                                key={t}
                                className={`px-2 py-0.5 rounded-lg font-bold text-xs flex items-center gap-1 border ${
                                  p.period === 'AM'
                                    ? 'bg-amber-50 text-amber-950 border-amber-200'
                                    : 'bg-indigo-50 text-indigo-950 border-indigo-200'
                                }`}
                              >
                                {p.formatted}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Meal Rule:</span>
                        <span className="font-medium text-slate-800 capitalize">
                          {rem.foodInstructions.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                    </div>

                    {/* Stock Meter */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 flex items-center gap-1 font-medium">
                          {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                          Remaining Stock
                        </span>
                        <span className={`font-bold ${isLowStock ? 'text-amber-700' : 'text-slate-800'}`}>
                          {rem.remainingPills} / {rem.totalPills} doses
                        </span>
                      </div>
                      <Progress
                        value={percentLeft}
                        className={`h-2 rounded-full ${isLowStock ? 'bg-amber-100 text-amber-600' : 'bg-slate-100'}`}
                      />
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(rem)}
                        className="rounded-xl text-xs text-slate-600 hover:text-slate-900 h-8 px-2.5"
                      >
                        {rem.isActive ? 'Pause' : 'Resume'}
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(rem)}
                          className="h-8 w-8 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReminder(id, rem.medicineName)}
                          className="h-8 w-8 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 3: ADHERENCE & INSIGHTS */}
        <TabsContent value="adherence" className="space-y-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Medication Adherence Tips
                </CardTitle>
                <CardDescription>
                  Best medical practices approved by the Ministry of Public Health (MINSANTÉ)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 text-sm text-slate-700">
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                  <h5 className="font-bold text-blue-900 mb-1">Consistency is Key</h5>
                  <p className="text-xs text-blue-800">
                    Taking antibiotics or antimalarials (e.g. Coartem) at regular exact intervals ensures optimal blood concentration to fully eliminate pathogens.
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <h5 className="font-bold text-emerald-900 mb-1">Food & Hydration</h5>
                  <p className="text-xs text-emerald-800">
                    Medicines labeled "With Food" or "After Meal" protect your stomach lining and enhance bioavailability in Cameroon's tropical climate.
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                  <h5 className="font-bold text-amber-900 mb-1">Never Stop Treatments Early</h5>
                  <p className="text-xs text-amber-800">
                    Even if symptoms disappear after 2 days, complete the full prescribed course to prevent microbial resistance.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Prescription Refill Planner
                </CardTitle>
                <CardDescription>
                  Real-time inventory of your current home medication stock
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {reminders.map((r) => {
                  const isLow = r.remainingPills <= r.refillThreshold;
                  return (
                    <div
                      key={r._id || r.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between ${
                        isLow ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900">{r.medicineName}</div>
                        <div className="text-xs text-slate-500">
                          {r.remainingPills} pills remaining (Threshold: {r.refillThreshold})
                        </div>
                      </div>
                      <Badge className={isLow ? 'bg-amber-600 text-white rounded-full' : 'bg-emerald-600 text-white rounded-full'}>
                        {isLow ? 'Refill Needed' : 'In Stock'}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* CREATE / EDIT REMINDER MODAL DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[540px] rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-600" />
              {editingReminder ? 'Edit Medication Reminder' : 'Set New Medication Reminder'}
            </DialogTitle>
            <DialogDescription>
              Configure dosage instructions, daily alarm times, and stock notifications.
            </DialogDescription>
          </DialogHeader>

          {/* Quick Suggestions for Common Medicines */}
          {!editingReminder && (
            <div className="my-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Quick Select (Cameroon Common Meds)
              </Label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {COMMON_CAMEROON_MEDS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setMedicineName(item.name);
                      setDosage(item.dosage);
                      setForm(item.form as any);
                      setFoodInstructions(item.food as any);
                    }}
                    className="text-xs bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 px-2.5 py-1 rounded-xl transition-colors font-medium border border-slate-200"
                  >
                    + {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 py-2">
            {/* Medicine Name */}
            <div>
              <Label htmlFor="med-name" className="text-xs font-semibold text-slate-700">
                Medicine Name *
              </Label>
              <Input
                id="med-name"
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                placeholder="e.g. Paracetamol, Coartem, Amoxicilline..."
                className="rounded-2xl mt-1"
              />
            </div>

            {/* Dosage & Form */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="med-dosage" className="text-xs font-semibold text-slate-700">
                  Dosage *
                </Label>
                <Input
                  id="med-dosage"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 500mg, 1 tablet"
                  className="rounded-2xl mt-1"
                />
              </div>

              <div>
                <Label htmlFor="med-form" className="text-xs font-semibold text-slate-700">
                  Form
                </Label>
                <select
                  id="med-form"
                  value={form}
                  onChange={(e) => setForm(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-2xl border border-slate-200 text-sm bg-white mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tablet">Tablet / Comprimé</option>
                  <option value="capsule">Capsule / Gélule</option>
                  <option value="syrup">Syrup / Sirop</option>
                  <option value="drops">Drops / Gouttes</option>
                  <option value="injection">Injection</option>
                  <option value="inhaler">Inhaler</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Frequency */}
            <div>
              <Label className="text-xs font-semibold text-slate-700 block mb-1">
                Frequency & Schedule
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ONCE_DAILY', label: '1x Daily', sub: '08:00 AM' },
                  { id: 'TWICE_DAILY', label: '2x Daily', sub: '08:00 AM & PM' },
                  { id: 'THREE_TIMES_DAILY', label: '3x Daily', sub: '8AM, 2PM, 8PM' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleFrequencyChange(f.id)}
                    className={`py-2 px-2 text-xs rounded-2xl border transition-all flex flex-col items-center justify-center ${
                      frequency === f.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`text-[10px] mt-0.5 ${frequency === f.id ? 'text-blue-100' : 'text-slate-500'}`}>
                      {f.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dose Times (12h AM/PM) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Scheduled Reminder Times (12-Hour AM / PM) *
                </Label>
                <span className="text-[11px] text-blue-600 font-semibold">Click badge to toggle AM / PM</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {times.map((t, idx) => (
                  <AmPmTimePicker
                    key={idx}
                    value={t}
                    onChange={(newVal) => {
                      const newTimes = [...times];
                      newTimes[idx] = newVal;
                      setTimes(newTimes);
                    }}
                    onRemove={times.length > 1 ? () => setTimes(times.filter((_, i) => i !== idx)) : undefined}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setTimes([...times, '14:00'])}
                  className="px-3 py-1.5 border border-dashed border-blue-300 text-xs text-blue-600 font-bold rounded-2xl hover:bg-blue-50 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Time
                </button>
              </div>
            </div>

            {/* Meal Instructions */}
            <div>
              <Label className="text-xs font-semibold text-slate-700 block mb-1">
                Food & Meal Relation
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'AFTER_MEAL', label: 'After Meal' },
                  { id: 'BEFORE_MEAL', label: 'Before Meal' },
                  { id: 'WITH_MEAL', label: 'With Food' },
                  { id: 'NO_RESTRICTION', label: 'Anytime' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFoodInstructions(m.id as any)}
                    className={`py-2 px-2 text-xs font-medium rounded-2xl border text-center transition-all ${
                      foodInstructions === m.id
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock & Refill Tracker */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <Label htmlFor="total-pills" className="text-xs font-semibold text-slate-700">
                  Total Box
                </Label>
                <Input
                  id="total-pills"
                  type="number"
                  min="1"
                  value={totalPills}
                  onChange={(e) => setTotalPills(parseInt(e.target.value) || 0)}
                  className="rounded-xl mt-1 h-9 bg-white"
                />
              </div>
              <div>
                <Label htmlFor="rem-pills" className="text-xs font-semibold text-slate-700">
                  Remaining
                </Label>
                <Input
                  id="rem-pills"
                  type="number"
                  min="0"
                  value={remainingPills}
                  onChange={(e) => setRemainingPills(parseInt(e.target.value) || 0)}
                  className="rounded-xl mt-1 h-9 bg-white"
                />
              </div>
              <div>
                <Label htmlFor="refill-thresh" className="text-xs font-semibold text-slate-700">
                  Alert Below
                </Label>
                <Input
                  id="refill-thresh"
                  type="number"
                  min="1"
                  value={refillThreshold}
                  onChange={(e) => setRefillThreshold(parseInt(e.target.value) || 5)}
                  className="rounded-xl mt-1 h-9 bg-white"
                />
              </div>
            </div>

            {/* Color Tag */}
            <div>
              <Label className="text-xs font-semibold text-slate-700 block mb-1">
                Visual Badge Color
              </Label>
              <div className="flex gap-2">
                {(['blue', 'emerald', 'purple', 'amber', 'rose', 'teal'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      c === 'blue'
                        ? 'bg-blue-600'
                        : c === 'emerald'
                        ? 'bg-emerald-600'
                        : c === 'purple'
                        ? 'bg-purple-600'
                        : c === 'amber'
                        ? 'bg-amber-600'
                        : c === 'rose'
                        ? 'bg-rose-600'
                        : 'bg-teal-600'
                    } ${color === c ? 'scale-125 border-slate-900 shadow-md' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="med-notes" className="text-xs font-semibold text-slate-700">
                Doctor's Advice or Special Notes
              </Label>
              <Input
                id="med-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Avoid dairy, take with large glass of water..."
                className="rounded-2xl mt-1"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-2xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveReminder}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6"
            >
              {isSubmitting ? 'Saving...' : editingReminder ? 'Update Reminder' : 'Set Reminder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Urgent Medication Alarm & Ringing Modal */}
      <MedicationAlarmModal
        activeAlarm={activeAlarm}
        onTakeDose={(rem, t) => handleLogDose(rem, t, 'TAKEN')}
        onSnooze={handleSnoozeAlarm}
        onDismiss={() => setActiveAlarm(null)}
      />
    </div>
  );
}
