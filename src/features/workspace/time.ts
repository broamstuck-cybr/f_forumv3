const clockFormat = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });
const dayFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' });

export function formatClock(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : clockFormat.format(date);
}

export function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toDateString() === new Date().toDateString()
    ? clockFormat.format(date)
    : dayFormat.format(date);
}
