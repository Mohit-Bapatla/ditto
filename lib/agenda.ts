export const agendaTimeZone = "America/Chicago";
export function dayKey(value: string | number | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: agendaTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
export function shiftDay(key: string, days: number) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function weekDays(selected: string) {
  const weekday = new Date(`${selected}T12:00:00Z`).getUTCDay();
  const monday = shiftDay(selected, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => shiftDay(monday, i));
}
export function agendaTime(start: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: agendaTimeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(start));
}
