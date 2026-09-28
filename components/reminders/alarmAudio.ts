/**
 * alarmAudio.ts
 * Medical Reminder Audio & 12-Hour AM/PM Helpers
 * Uses Web Audio API to create crystal-clear medical chime ringtones without external mp3 dependencies.
 */

// Parse "HH:mm" (24h) to 12h representation
export function formatTime12h(time24: string = '08:00'): {
  formatted: string;
  hour12: number;
  minute: number;
  period: 'AM' | 'PM';
  raw24: string;
} {
  if (!time24 || !time24.includes(':')) {
    return { formatted: '08:00 AM', hour12: 8, minute: 0, period: 'AM', raw24: '08:00' };
  }

  const [hStr, mStr] = time24.split(':');
  let hour = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10) || 0;

  if (isNaN(hour)) hour = 8;
  const period: 'AM' | 'PM' = hour >= 12 ? 'PM' : 'AM';
  let hour12 = hour % 12;
  if (hour12 === 0) hour12 = 12;

  const formattedHour = String(hour12).padStart(2, '0');
  const formattedMin = String(minute).padStart(2, '0');
  const formatted = `${formattedHour}:${formattedMin} ${period}`;

  return { formatted, hour12, minute, period, raw24: time24 };
}

// Convert 12h parts back to 24h string "HH:mm"
export function time12hTo24h(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  let h = Number(hour12) || 12;
  if (h > 12) h = 12;
  if (h < 1) h = 1;

  let h24 = h;
  if (period === 'AM') {
    if (h === 12) h24 = 0;
  } else {
    // PM
    if (h < 12) h24 = h + 12;
  }

  const m = Math.min(59, Math.max(0, Number(minute) || 0));
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Audio Context Singleton for browser autoplay compatibility
let sharedAudioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

/**
 * Plays an alarm ringtone for due medication.
 * Melodic multi-tone bell chime: E5 -> G#5 -> B5 -> E6
 * Loops repeatedly every 1.6s until stopped.
 */
export function startAlarmRinging(onLoop?: () => void): { stop: () => void } {
  let isStopped = false;
  let timerId: any = null;

  const playSingleChimeCycle = () => {
    if (isStopped) return;
    try {
      const ctx = getAudioContext();
      const notes = [
        { freq: 659.25, time: 0 },       // E5
        { freq: 830.61, time: 0.18 },    // G#5
        { freq: 987.77, time: 0.36 },    // B5
        { freq: 1318.51, time: 0.54 },   // E6
        { freq: 987.77, time: 0.72 },    // B5
        { freq: 1318.51, time: 0.90 },   // E6 high bell
      ];

      notes.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

        gain.gain.setValueAtTime(0.22, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + 0.36);
      });

      if (onLoop) onLoop();
    } catch (e) {
      console.warn('Audio playback not permitted or supported:', e);
    }

    if (!isStopped) {
      timerId = setTimeout(playSingleChimeCycle, 1600);
    }
  };

  playSingleChimeCycle();

  return {
    stop: () => {
      isStopped = true;
      if (timerId) clearTimeout(timerId);
    },
  };
}

/**
 * Play a single short notification bell (for preview or reminder alert)
 */
export function playNotificationChime(): void {
  try {
    const ctx = getAudioContext();
    const notes = [
      { freq: 783.99, time: 0 },     // G5
      { freq: 1046.50, time: 0.16 }, // C6
    ];

    notes.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + 0.3);
    });
  } catch (e) {}
}

/**
 * Play a cheerful celebration chime when dose is recorded as taken
 */
export function playDoseTakenChime(): void {
  try {
    const ctx = getAudioContext();
    const notes = [
      { freq: 523.25, time: 0 },    // C5
      { freq: 659.25, time: 0.1 },  // E5
      { freq: 783.99, time: 0.2 },  // G5
      { freq: 1046.50, time: 0.3 }, // C6
    ];

    notes.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + 0.35);
    });
  } catch (e) {}
}
