import React, { useState, useEffect, useRef } from 'react';
import { PillReminderItem } from './PillRemindersView';
import { MedicationAlarmModal, ActiveAlarmPayload } from './MedicationAlarmModal';
import { formatTime12h, playDoseTakenChime } from './alarmAudio';
import { toast } from 'sonner';

export function PillReminderAlarmListener({ user }: { user: any }) {
  const [reminders, setReminders] = useState<PillReminderItem[]>([]);
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarmPayload | null>(null);
  const triggeredAlarmsRef = useRef<Set<string>>(new Set());

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

  // Fetch or sync active reminders from backend / cache
  const loadReminders = async () => {
    const token = getAuthToken();
    if (token) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/reminders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data && Array.isArray(data.data.reminders)) {
          setReminders(data.data.reminders);
          localStorage.setItem('patientPillReminders', JSON.stringify(data.data.reminders));
          return;
        }
      } catch (e) {}
    }

    const cached = localStorage.getItem('patientPillReminders');
    if (cached) {
      try {
        setReminders(JSON.parse(cached));
      } catch (e) {}
    }
  };

  useEffect(() => {
    loadReminders();

    // Listen for custom trigger to test alarm from any component
    const handleTestAlarmEvent = (e: any) => {
      const sampleReminder: PillReminderItem = e.detail?.reminder || {
        _id: 'test_sample',
        medicineName: 'Paracétamol Biogaran',
        dosage: '1000mg',
        form: 'tablet',
        frequency: 'TWICE_DAILY',
        times: ['08:00', '20:00'],
        foodInstructions: 'AFTER_MEAL',
        totalPills: 20,
        remainingPills: 14,
        refillReminder: true,
        refillThreshold: 4,
        color: 'blue',
        notes: 'Prendre avec un grand verre d’eau tiède.',
        isActive: true,
      };

      const now = new Date();
      const currentH = String(now.getHours()).padStart(2, '0');
      const currentM = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentH}:${currentM}`;

      setActiveAlarm({
        reminder: sampleReminder,
        time: timeStr,
        date: getTodayDateString(),
      });
    };

    window.addEventListener('testMedicationAlarm', handleTestAlarmEvent);
    window.addEventListener('pillRemindersUpdated', loadReminders);

    return () => {
      window.removeEventListener('testMedicationAlarm', handleTestAlarmEvent);
      window.removeEventListener('pillRemindersUpdated', loadReminders);
    };
  }, []);

  // Alarm Real-Time Clock Ticker (runs every 5 seconds)
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

              // 1. In-App Ringing Modal
              setActiveAlarm({
                reminder,
                time: t,
                date: today,
              });

              // 2. Desktop Notification
              if ('Notification' in window && Notification.permission === 'granted') {
                const time12 = formatTime12h(t).formatted;
                try {
                  const notif = new Notification(`⏰ MediConnect : Heure de prise (${time12})`, {
                    body: `Prenez votre dose de ${reminder.medicineName} (${reminder.dosage}) • ${reminder.foodInstructions?.replace('_', ' ')}`,
                    icon: '/favicon.ico',
                    requireInteraction: true,
                    tag: alarmKey,
                  });
                  notif.onclick = () => {
                    window.focus();
                  };
                } catch (err) {}
              }

              // 3. Register in Database Notifications
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

  const handleTakeDose = async (reminder: PillReminderItem, time: string) => {
    setActiveAlarm(null);
    playDoseTakenChime();
    const today = getTodayDateString();
    const token = getAuthToken();
    const rId = reminder._id || reminder.id;

    toast.success(`Dose of ${reminder.medicineName} recorded as taken! 🎉`);

    // Update local state and cache
    setReminders((prev) =>
      prev.map((r) => {
        if ((r._id || r.id) === rId) {
          const currentHistory = (r.takenHistory || []).filter(
            (h) => !(h.date === today && h.time === time)
          );
          return {
            ...r,
            remainingPills: Math.max(0, r.remainingPills - 1),
            takenHistory: [
              ...currentHistory,
              { date: today, time, status: 'TAKEN', takenAt: new Date().toISOString() },
            ],
          };
        }
        return r;
      })
    );

    window.dispatchEvent(new Event('pillRemindersUpdated'));

    if (token && rId) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/reminders/${rId}/take`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ time, status: 'TAKEN', date: today }),
        });
      } catch (e) {}
    }
  };

  const handleSnooze = (reminder: PillReminderItem, time: string, minutes: number = 5) => {
    setActiveAlarm(null);
    toast.info(`Rappel reporté de ${minutes} minutes ⏰`);
    setTimeout(() => {
      setActiveAlarm({
        reminder,
        time,
        date: getTodayDateString(),
      });
    }, minutes * 60 * 1000);
  };

  return (
    <MedicationAlarmModal
      activeAlarm={activeAlarm}
      onTakeDose={handleTakeDose}
      onSnooze={handleSnooze}
      onDismiss={() => setActiveAlarm(null)}
    />
  );
}
