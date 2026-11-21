export const iso = (d: Date, tz: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
export const lastNDays = (n: number, tz: string) =>
  Array.from({ length: n }, (_, i) => iso(new Date(Date.now() - (n - 1 - i) * 86400000), tz));
export function streak(activeDays: Set<string>, tz: string) {
  let count = 0;
  let cursor = Date.now();
  if (!activeDays.has(iso(new Date(cursor), tz))) cursor -= 86400000; // today may still be in progress
  while (activeDays.has(iso(new Date(cursor), tz))) { count++; cursor -= 86400000; }
  return count;
}
