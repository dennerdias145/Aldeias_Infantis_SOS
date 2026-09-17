export function toDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value.length <= 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: string | Date | null | undefined) {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatLongDate(value: string | Date | null | undefined) {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

export function formatTime(value: string | Date | null | undefined) {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(value: string | Date | null | undefined) {
  const d = toDate(value);
  if (!d) return "—";
  return `${formatDate(d)} às ${formatTime(d)}`;
}

export function timeAgo(value: string | null | undefined) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  if (d < 30) return `há ${d}d`;
  return formatDate(value);
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function startOfWeek(d: Date) {
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

export function startOfMonth(d: Date) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function isToday(value: string | Date | null | undefined) {
  const d = toDate(value);
  return d ? isSameDay(d, new Date()) : false;
}

export function toInputDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function seconds(value: number | null | undefined) {
  const s = Math.max(0, Math.round(value ?? 0));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
