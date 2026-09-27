const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });

export function formatClock(timestamp: number) {
  return timeFormat.format(timestamp);
}

export function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return date.toDateString() === new Date().toDateString() ? timeFormat.format(date) : dateFormat.format(date);
}
