import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { iso, lastNDays, streak } from "@/lib/dates";
import Clock from "@/components/Clock";
import HabitChecklist from "@/components/HabitChecklist";
import FocusChart from "@/components/FocusChart";

type Session = { track_slug: string | null; session_type: string; duration_seconds: number; completed: boolean; started_at: string };
const hours = (s: number) => Math.round((s / 3600) * 10) / 10;
const greeting = (h: number) => (h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");

export default async function Overview() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const uid = user!.id;
  const since = new Date(Date.now() - 45 * 86400000).toISOString();

  const [prof, dsa, rl, habits, logs, sess] = await Promise.all([
    supabase.from("profiles").select("display_name,timezone,daily_focus_minutes").eq("id", uid).single(),
    supabase.from("dsa_topics").select("status,est_hours,actual_hours"),
    supabase.from("rl_progress").select("completion,status,est_hours,actual_hours,project_done"),
    supabase.from("habits").select("id,name").eq("archived", false).order("sort"),
    supabase.from("habit_logs").select("habit_id,log_date").gte("log_date", iso(new Date(Date.now() - 45 * 86400000), "UTC")),
    supabase.from("focus_sessions").select("track_slug,session_type,duration_seconds,completed,started_at").gte("started_at", since),
  ]);
  const firstError = [prof, dsa, rl, habits, logs, sess].find((r) => r.error)?.error;
  if (firstError) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Couldn’t load your data: {firstError.message}</p>;

  const tz = prof.data?.timezone ?? "Asia/Kolkata";
  const today = iso(new Date(), tz);
  const days = lastNDays(7, tz);
  const focus = ((sess.data ?? []) as Session[]).filter((s) => s.session_type === "focus" && s.completed);
  const byDay = (d: string) => focus.filter((s) => iso(new Date(s.started_at), tz) === d).reduce((a, s) => a + s.duration_seconds, 0);
  const weekFocus = days.map((d) => ({ day: new Date(d + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short" }), hours: hours(byDay(d)) }));
  const weekSet = new Set(days);
  const trackWeek = (slug: string) => hours(focus.filter((s) => (s.track_slug === slug || (slug === "dsa" && s.track_slug?.startsWith("dsa:"))) && weekSet.has(iso(new Date(s.started_at), tz))).reduce((a, s) => a + s.duration_seconds, 0));

  const hl = logs.data ?? [];
  const doneToday = new Set(hl.filter((l) => l.log_date === today).map((l) => l.habit_id));
  const habitList = (habits.data ?? []).map((h) => ({ id: h.id, name: h.name, done: doneToday.has(h.id) }));
  const active = new Set<string>([...hl.map((l) => l.log_date), ...focus.map((s) => iso(new Date(s.started_at), tz))]);
  const currentStreak = streak(active, tz);

  const d = dsa.data ?? [];
  const dsaDone = d.filter((t) => t.status === "done").length;
  const r = rl.data ?? [];
  const rlPct = r.length ? Math.round(r.reduce((a, t) => a + t.completion, 0) / r.length) : 0;
  const rlDone = r.filter((t) => t.status === "done").length;
  const habitPct = habitList.length ? Math.round((habitList.filter((h) => h.done).length / habitList.length) * 100) : 0;
  const todayFocusSec = byDay(today);
  const todayLogs = focus.filter((s) => iso(new Date(s.started_at), tz) === today).sort((a,b) => b.started_at.localeCompare(a.started_at));
  const goalMin = prof.data?.daily_focus_minutes ?? 240;

  const cards = [
    { name: "DSA", href: "/dsa", pct: d.length ? Math.round((dsaDone / d.length) * 100) : 0, line: `${dsaDone} of ${d.length} topics`, week: `${trackWeek("dsa")} h this week`, left: `${d.length - dsaDone} topics remaining` },
    { name: "AI Engineering", href: "/ai-engineering", pct: 0, line: "Foundations roadmap", week: `${trackWeek("ai")} h this week`, left: "7 stages to track" },
    { name: "Reinforcement Learning", href: "/reinforcement-learning", pct: rlPct, line: `${rlDone} of 54 topics`, week: `${trackWeek("rl")} h this week`, left: `${r.filter((t) => t.project_done).length} of 54 projects built` },
    { name: "Scaler Academics", href: "/scaler", pct: 0, line: "Upload a syllabus PDF", week: `${trackWeek("scaler")} h this week`, left: "Build a topic checklist" },
    { name: "IIT Madras BS", href: "/iitm", pct: 0, line: "Upload a syllabus PDF", week: `${trackWeek("iitm")} h this week`, left: "Build a topic checklist" },
    { name: "Gym & Fitness", href: "/fitness", pct: 0, line: "No workouts logged", week: "—", left: "Log today’s workout" },
    { name: "Habits", href: "/rituals", pct: habitPct, line: `${habitList.filter((h) => h.done).length} of ${habitList.length} today`, week: `${currentStreak}-day streak`, left: "" },
  ];

  const name = (prof.data?.display_name ?? "").split(" ")[0];
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(new Date()));

  return (
    <div className="aurora-enter space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{greeting(hour)}{name ? `, ${name}` : ""}.</h1>
          <p className="mt-1 text-sm text-muted">Valar Mougules.</p>
        </div>
        <Clock tz={tz} />
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Focus today" value={`${hours(todayFocusSec)} h`} sub={`of ${hours(goalMin * 60)} h goal`} pct={Math.min(100, (todayFocusSec / 60 / goalMin) * 100)} />
        <Stat label="Current streak" value={`${currentStreak} ${currentStreak === 1 ? "day" : "days"}`} sub="habit or focus activity" />
        <Stat label="Habits today" value={`${habitPct}%`} sub={`${habitList.filter((h) => h.done).length} of ${habitList.length} done`} pct={habitPct} />
      </section>

      <section className="glass aurora-card rounded-3xl p-5 shadow-soft">
        <div className="flex items-baseline justify-between gap-3"><h2 className="font-semibold">Today’s study log</h2><span className="text-xs text-muted">{todayLogs.length} {todayLogs.length === 1 ? "session" : "sessions"}</span></div>
        {todayLogs.length ? <ul className="mt-3 divide-y divide-line">{todayLogs.map((s,i) => <li key={`${s.started_at}-${i}`} className="flex items-center gap-3 py-2.5 text-sm"><span className="h-2 w-2 rounded-full bg-accent"/><span className="flex-1">{s.track_slug?.startsWith("dsa:") ? s.track_slug.slice(4) : s.track_slug === "focus" ? "Focus session" : s.track_slug ?? "Study session"}</span><span className="font-medium tabular-nums">{Math.max(1,Math.round(s.duration_seconds/60))} min</span></li>)}</ul> : <p className="mt-2 text-sm text-muted">Log time beside a topic in DSA and it will show here with today’s work.</p>}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="glass rounded-3xl p-6 shadow-soft lg:col-span-2">
          <h2 className="mb-3 text-base font-semibold">Today’s rituals</h2>
          <HabitChecklist habits={habitList} today={today} userId={uid} />
        </div>
        <div className="glass rounded-3xl p-6 shadow-soft lg:col-span-3">
          <h2 className="text-base font-semibold">Focus, last 7 days</h2>
          <p className="mb-2 text-sm text-muted">{hours(weekFocus.reduce((a, x) => a + x.hours * 3600, 0))} h total · from completed focus sessions</p>
          <FocusChart data={weekFocus} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Dimensions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link key={c.name} href={c.href} className="glass group rounded-3xl p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-accent">
              <div className="flex items-baseline justify-between"><h3 className="font-semibold">{c.name}</h3><span className="text-2xl font-semibold text-deep">{c.pct}%</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-light"><div className="h-full rounded-full bg-gradient-to-r from-accent to-deep transition-[width]" style={{ width: `${c.pct}%` }} /></div>
              <p className="mt-3 text-sm">{c.line}</p>
              <p className="mt-1 text-xs text-muted">{[c.week, c.left].filter(Boolean).join(" · ")}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, sub, pct }: { label: string; value: string; sub: string; pct?: number }) {
  return (
    <div className="glass rounded-3xl p-5 shadow-soft">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
      {pct !== undefined && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-light"><div className="h-full rounded-full bg-deep" style={{ width: `${pct}%` }} /></div>}
      <p className="mt-2 text-xs text-muted">{sub}</p>
    </div>
  );
}
