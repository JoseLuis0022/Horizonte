const DAY = 86_400_000;

export function breakdown(target, now) {
  const total = Math.max(0, target - now);
  const s = Math.floor(total / 1000);
  return {
    done: target <= now,
    total,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export const pad = (n) => String(n).padStart(2, '0');

export function progress(createdAt, target, now) {
  const span = target - createdAt;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (now - createdAt) / span));
}

const dateFmt = new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const longFmt = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' });
const todayFmt = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
const rtf = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' });

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const formatDate = (ts) => cap(`${dateFmt.format(ts)} · ${timeFmt.format(ts)}`);
export const formatLongDate = (ts) => cap(longFmt.format(ts));
export const formatTime = (ts) => timeFmt.format(ts);
export const formatToday = (ts) => cap(todayFmt.format(ts));

export function relative(target, now) {
  return cap(relativeRaw(target, now));
}

function relativeRaw(target, now) {
  const diff = target - now;
  const abs = Math.abs(diff);
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), 'minute');
  if (abs < DAY) return rtf.format(Math.round(diff / 3_600_000), 'hour');
  if (abs < 60 * DAY) return rtf.format(Math.round(diff / DAY), 'day');
  return rtf.format(Math.round(diff / (30 * DAY)), 'month');
}

// <input type="date|time"> trabajan en hora local.
export function toInputs(ts) {
  const d = new Date(ts);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function fromInputs(date, time) {
  if (!date) return NaN;
  return new Date(`${date}T${time || '00:00'}`).getTime();
}

export { DAY };
