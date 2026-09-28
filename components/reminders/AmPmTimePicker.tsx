import React, { useState, useEffect } from 'react';
import { formatTime12h, time12hTo24h } from './alarmAudio';
import { Button } from '../ui/button';
import { Clock, Sun, Moon, Check } from 'lucide-react';
import { Badge } from '../ui/badge';

interface AmPmTimePickerProps {
  value: string; // 24h format "HH:mm"
  onChange: (value24: string) => void;
  label?: string;
  onRemove?: () => void;
}

export function AmPmTimePicker({ value, onChange, label, onRemove }: AmPmTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const parsed = formatTime12h(value);

  const [hour12, setHour12] = useState<number>(parsed.hour12);
  const [minute, setMinute] = useState<number>(parsed.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(parsed.period);

  useEffect(() => {
    const p = formatTime12h(value);
    setHour12(p.hour12);
    setMinute(p.minute);
    setPeriod(p.period);
  }, [value]);

  const handleUpdate = (newHour: number, newMin: number, newPeriod: 'AM' | 'PM') => {
    setHour12(newHour);
    setMinute(newMin);
    setPeriod(newPeriod);
    const time24 = time12hTo24h(newHour, newMin, newPeriod);
    onChange(time24);
  };

  const applyPreset = (h: number, m: number, p: 'AM' | 'PM') => {
    handleUpdate(h, m, p);
    setIsOpen(false);
  };

  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className="relative">
      {/* Pill Display Button */}
      <div className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl px-3 py-1.5 shadow-xs transition-all">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-xs font-bold text-slate-900 focus:outline-none"
        >
          {period === 'AM' ? (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
          )}
          <span className="font-mono text-sm tracking-wide">{parsed.formatted}</span>
          <Badge
            className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md ${
              period === 'AM'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-indigo-100 text-indigo-950 border border-indigo-300'
            }`}
          >
            {period}
          </Badge>
        </button>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-400 hover:text-red-500 text-sm font-bold pl-1 border-l border-slate-200 ml-1 transition-colors"
            title="Remove time"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown 12-Hour AM/PM Selector Popover */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 z-50 w-72 bg-white rounded-3xl shadow-xl border border-slate-200 p-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                Select Alarm Time (12h AM/PM)
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* AM / PM Toggle Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => handleUpdate(hour12, minute, 'AM')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  period === 'AM'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                AM (Matin / Morning)
              </button>
              <button
                type="button"
                onClick={() => handleUpdate(hour12, minute, 'PM')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  period === 'PM'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                PM (Soir / Evening)
              </button>
            </div>

            {/* Hour and Minute Selectors */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Hour (Heure)
                </label>
                <select
                  value={hour12}
                  onChange={(e) => handleUpdate(parseInt(e.target.value, 10), minute, period)}
                  className="w-full h-10 px-2 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {hoursList.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Minute
                </label>
                <select
                  value={minute}
                  onChange={(e) => handleUpdate(hour12, parseInt(e.target.value, 10), period)}
                  className="w-full h-10 px-2 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {minutesList.map((m) => (
                    <option key={m} value={m}>
                      :{String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5 mb-3 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Quick Presets (Raccourcis)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset(8, 0, 'AM')}
                  className="text-left px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-semibold flex items-center justify-between border border-amber-200"
                >
                  <span>🌅 Matin</span>
                  <span className="font-mono font-bold">08:00 AM</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(12, 30, 'PM')}
                  className="text-left px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-semibold flex items-center justify-between border border-amber-200"
                >
                  <span>☀️ Midi</span>
                  <span className="font-mono font-bold">12:30 PM</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(6, 30, 'PM')}
                  className="text-left px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-950 text-xs font-semibold flex items-center justify-between border border-indigo-200"
                >
                  <span>🌇 Soir</span>
                  <span className="font-mono font-bold">06:30 PM</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(9, 30, 'PM')}
                  className="text-left px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-950 text-xs font-semibold flex items-center justify-between border border-indigo-200"
                >
                  <span>🌙 Coucher</span>
                  <span className="font-mono font-bold">09:30 PM</span>
                </button>
              </div>
            </div>

            {/* Done Button */}
            <Button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full h-9 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Confirm {parsed.formatted}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
