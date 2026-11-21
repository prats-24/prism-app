"use client";
import { useEffect, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
export default function Clock({ tz }: { tz: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  if (!now) return <div className="h-[76px] w-64 animate-pulse rounded-2xl bg-light/70" />;
  const parts = new Intl.DateTimeFormat("en-IN", { timeZone: tz, weekday: "long", day: "2-digit", month: "short", year: "numeric" }).formatToParts(now);
  const day = parts.find(x => x.type === "day")?.value ?? "--";
  const month = parts.find(x => x.type === "month")?.value ?? "";
  const year = parts.find(x => x.type === "year")?.value ?? "";
  const weekday = parts.find(x => x.type === "weekday")?.value ?? "";
  const time = new Intl.DateTimeFormat("en-IN", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(now);
  const clockTime = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  const seconds = clockTime.getSeconds();
  const minutes = clockTime.getMinutes() + seconds / 60;
  const hour = (clockTime.getHours() % 12) + minutes / 60;
  return <div className="inline-flex items-center gap-3 rounded-2xl border border-line bg-card/75 p-2.5 shadow-soft backdrop-blur">
    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-light text-center"><CalendarDays size={14} className="text-deep"/><span className="-mt-1 text-xl font-semibold leading-none text-deep">{day}</span><span className="text-[9px] font-semibold uppercase tracking-wide text-muted">{month}</span></div>
    <div className="min-w-0"><p className="text-xs font-medium text-muted">{weekday} · {year}</p><p className="mt-0.5 font-mono text-lg font-semibold tabular-nums tracking-tight">{time}</p></div>
    <div className="relative ml-1 h-11 w-11 shrink-0 rounded-full border-2 border-accent2 bg-bg shadow-inner"><span className="absolute left-1/2 top-1/2 h-3 w-0.5 origin-bottom rounded-full bg-deep" style={{ transform: `translate(-50%,-100%) rotate(${hour * 30}deg)` }}/><span className="absolute left-1/2 top-1/2 h-4 w-0.5 origin-bottom rounded-full bg-accent" style={{ transform: `translate(-50%,-100%) rotate(${minutes * 6}deg)` }}/><span className="absolute left-1/2 top-1/2 h-4 w-px origin-bottom bg-accent2" style={{ transform: `translate(-50%,-100%) rotate(${seconds * 6}deg)` }}/><span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-deep"/><Clock3 className="sr-only"/></div>
  </div>;
}
