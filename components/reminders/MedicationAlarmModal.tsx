import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Bell, 
  BellRing, 
  Check, 
  Clock, 
  Volume2, 
  VolumeX, 
  Utensils, 
  Pill,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { startAlarmRinging, playDoseTakenChime, formatTime12h } from './alarmAudio';
import { PillReminderItem } from './PillRemindersView';

export interface ActiveAlarmPayload {
  reminder: PillReminderItem;
  time: string; // 24h format
  date: string; // YYYY-MM-DD
}

interface MedicationAlarmModalProps {
  activeAlarm: ActiveAlarmPayload | null;
  onTakeDose: (reminder: PillReminderItem, time: string) => void;
  onSnooze: (reminder: PillReminderItem, time: string, minutes: number) => void;
  onDismiss: () => void;
}

export function MedicationAlarmModal({
  activeAlarm,
  onTakeDose,
  onSnooze,
  onDismiss,
}: MedicationAlarmModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [audioController, setAudioController] = useState<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (activeAlarm && !isMuted) {
      // Start ringing audio sequence
      const controller = startAlarmRinging();
      setAudioController(controller);

      return () => {
        controller.stop();
      };
    } else {
      if (audioController) {
        audioController.stop();
        setAudioController(null);
      }
    }
  }, [activeAlarm, isMuted]);

  if (!activeAlarm) return null;

  const { reminder, time } = activeAlarm;
  const timeFormatted = formatTime12h(time);

  const handleTake = () => {
    if (audioController) audioController.stop();
    playDoseTakenChime();
    onTakeDose(reminder, time);
  };

  const handleSnooze = (minutes: number = 5) => {
    if (audioController) audioController.stop();
    onSnooze(reminder, time, minutes);
  };

  const handleMuteToggle = () => {
    if (!isMuted) {
      if (audioController) audioController.stop();
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const getFoodText = (instruction: string) => {
    switch (instruction) {
      case 'AFTER_MEAL':
        return 'After Meal (Après le repas)';
      case 'BEFORE_MEAL':
        return 'Before Meal (Avant le repas)';
      case 'WITH_MEAL':
        return 'With Food (Pendant le repas)';
      case 'EMPTY_STOMACH':
        return 'Empty Stomach (À jeun)';
      default:
        return 'Anytime (Sans restriction)';
    }
  };

  return (
    <Dialog open={Boolean(activeAlarm)} onOpenChange={(open) => !open && handleSnooze(5)}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-0 overflow-hidden border-2 border-rose-500 shadow-2xl animate-in zoom-in-95">
        {/* Animated Alarm Top Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white p-6 relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          {/* Pulsing Alarm Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner ring-4 ring-white/30 animate-pulse">
            <BellRing className="w-8 h-8 text-yellow-300 animate-bounce" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-xs font-black tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Medication Due Now • Alarme Médicale
          </div>

          <DialogTitle className="text-2xl font-black tracking-tight text-white">
            {timeFormatted.formatted}
          </DialogTitle>
          <DialogDescription className="text-rose-100 text-xs mt-0.5">
            It is time to take your prescribed dose. Do not skip your treatment!
          </DialogDescription>

          {/* Sound Mute Toggle in top-right */}
          <button
            type="button"
            onClick={handleMuteToggle}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            title={isMuted ? 'Unmute Ringing' : 'Mute Ringing'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-200" /> : <Volume2 className="w-4 h-4 text-yellow-300" />}
          </button>
        </div>

        {/* Medication Details Card */}
        <div className="p-6 space-y-4 bg-slate-50/50">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Pill className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 leading-tight">
                  {reminder.medicineName}
                </h4>
                <p className="text-sm font-bold text-blue-600 mt-0.5">
                  {reminder.dosage} • <span className="capitalize">{reminder.form}</span>
                </p>
              </div>
            </div>

            <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-mono text-xs font-black">
              {timeFormatted.period}
            </Badge>
          </div>

          {/* Food Instruction & Notes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80">
              <Utensils className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Consigne : {getFoodText(reminder.foodInstructions)}</span>
            </div>

            {reminder.notes && (
              <div className="text-xs text-slate-600 bg-slate-100 p-2.5 rounded-xl border border-slate-200 italic">
                "{reminder.notes}"
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <Button
              type="button"
              onClick={handleTake}
              className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Check className="w-5 h-5" />
              Mark as Taken Now (J'ai pris ma dose)
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSnooze(5)}
                className="h-10 rounded-2xl border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Snooze 5 min
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (audioController) audioController.stop();
                  onDismiss();
                }}
                className="h-10 rounded-2xl text-slate-500 hover:text-slate-800 font-semibold text-xs"
              >
                Dismiss / Ignorer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
