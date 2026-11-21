"use client";
import { useState } from "react";
import { Check, ChevronDown, Circle, CircleDot, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Week = { id: string; week_no: number; title: string; starts_on: string | null; ends_on: string | null; dsa_hours: number; ai_hours: number; ai_focus: string | null };
type Topic = { id: string; user_id: string; week_id: string; title: string; status: "not_started" | "in_progress" | "done"; est_hours: number; actual_hours: number; sort: number };
const NEXT = { not_started: "in_progress", in_progress: "done", done: "not_started" } as const;
const fmt = (d: string | null) => (d ? new Date(d + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "");

export default function DsaBoard({ weeks, topics: initial }: { weeks: Week[]; topics: Topic[] }) {
  const supabase = createClient();
  const [topics, setTopics] = useState(initial);
  const [open, setOpen] = useState<Set<string>>(() => {
    const firstOpen = weeks.find((w) => initial.some((t) => t.week_id === w.id && t.status !== "done"));
    return new Set(firstOpen ? [firstOpen.id] : []);
  });
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [logHours, setLogHours] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function patch(id: string, change: Partial<Topic>) {
    const prev = topics;
    setTopics((xs) => xs.map((t) => (t.id === id ? { ...t, ...change } : t)));
    const { error } = await supabase.from("dsa_topics").update(change).eq("id", id);
    if (error) { setTopics(prev); setError("Couldn’t save that change."); } else setError(null);
  }
  async function remove(id: string) {
    const prev = topics;
    setTopics((xs) => xs.filter((t) => t.id !== id));
    const { error } = await supabase.from("dsa_topics").delete().eq("id", id);
    if (error) { setTopics(prev); setError("Couldn’t delete that topic."); }
  }
  async function add(week: Week) {
    const title = (draft[week.id] ?? "").trim();
    if (!title) return;
    const sort = Math.max(0, ...topics.filter((t) => t.week_id === week.id).map((t) => t.sort)) + 1;
    const uid = topics[0]?.user_id ?? (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase.from("dsa_topics").insert({ user_id: uid, week_id: week.id, title, sort }).select().single();
    if (error || !data) return setError("Couldn’t add that topic.");
    setTopics((xs) => [...xs, data as Topic]); setDraft((d) => ({ ...d, [week.id]: "" })); setError(null);
  }
  async function logStudy(t: Topic) {
    const studied = Number(logHours[t.id]);
    if (!Number.isFinite(studied) || studied <= 0) return setError("Enter how many hours you studied today.");
    const seconds = Math.round(studied * 3600);
    const { error } = await supabase.from("focus_sessions").insert({
      user_id: t.user_id, track_slug: `dsa:${t.title}`, session_type: "focus",
      planned_seconds: seconds, started_at: new Date(Date.now() - seconds * 1000).toISOString(),
      ended_at: new Date().toISOString(), duration_seconds: seconds, completed: true,
    });
    if (error) return setError("Couldn’t log that study time.");
    const { error: topicError } = await supabase.from("dsa_topics").update({ actual_hours: Number(t.actual_hours) + studied }).eq("id", t.id);
    if (topicError) return setError("Study time was logged, but the topic total could not refresh.");
    setTopics(xs => xs.map(x => x.id === t.id ? { ...x, actual_hours: Number(x.actual_hours) + studied } : x));
    setLogHours(v => ({ ...v, [t.id]: "" })); setError(null);
  }

  const done = topics.filter((t) => t.status === "done").length;
  const actual = topics.reduce((a, t) => a + Number(t.actual_hours), 0);
  const num = "w-16 rounded-lg border border-line bg-card px-2 py-1 text-right text-xs outline-none focus:border-deep";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">DSA</h1>
        <p className="mt-1 text-sm text-muted">18 Nov – 29 Dec 2026 · Python primary, Java for selected translations · {done} of {topics.length} topics · {Math.round(actual * 10) / 10} h logged</p>
      </header>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {weeks.map((w) => {
        const ts = topics.filter((t) => t.week_id === w.id).sort((a, b) => a.sort - b.sort);
        const wd = ts.filter((t) => t.status === "done").length;
        const isOpen = open.has(w.id);
        return (
          <section key={w.id} className="glass overflow-hidden rounded-3xl shadow-soft">
            <button onClick={() => setOpen((s) => { const n = new Set(s); n.has(w.id) ? n.delete(w.id) : n.add(w.id); return n; })} aria-expanded={isOpen} className="flex w-full items-center gap-4 p-5 text-left">
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{w.title} <span className="font-normal text-muted">· {fmt(w.starts_on)} – {fmt(w.ends_on)} · {w.dsa_hours} h DSA + {w.ai_hours} h AI</span></h2>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-light"><div className="h-full rounded-full bg-deep transition-[width]" style={{ width: `${ts.length ? (wd / ts.length) * 100 : 0}%` }} /></div>
              </div>
              <span className="text-sm text-muted">{wd}/{ts.length}</span>
              <ChevronDown size={18} className={`text-muted transition ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="border-t border-line px-5 pb-5 pt-3">
                {w.ai_focus && <p className="mb-3 rounded-xl bg-light px-3 py-2 text-sm"><span className="font-medium">AI focus:</span> {w.ai_focus}</p>}
                <ul className="space-y-1">
                  {ts.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-bg2">
                      <button onClick={() => patch(t.id, { status: NEXT[t.status] })} title={`Status: ${t.status.replace("_", " ")} (click to change)`} className="text-deep">
                        {t.status === "done" ? <span className="grid h-5 w-5 place-items-center rounded-full bg-deep text-white"><Check size={13} strokeWidth={3} /></span> : t.status === "in_progress" ? <CircleDot size={20} /> : <Circle size={20} className="text-accent" />}
                      </button>
                      <span className={`flex-1 text-sm ${t.status === "done" ? "text-muted line-through" : ""}`}>{t.title}</span>
                      <label className="flex items-center gap-1 text-xs text-muted">hours today<input aria-label={`Hours studied today for ${t.title}`} type="number" min={0} step={0.25} value={logHours[t.id] ?? ""} onChange={e=>setLogHours(v=>({...v,[t.id]:e.target.value}))} placeholder="0" className={num} /></label>
                      <button onClick={()=>logStudy(t)} className="rounded-lg bg-light px-2.5 py-1.5 text-xs font-medium text-deep">Log time</button>
                      <button onClick={() => remove(t.id)} aria-label={`Delete ${t.title}`} className="text-muted hover:text-red-600"><Trash2 size={15} /></button>
                    </li>
                  ))}
                </ul>
                <form onSubmit={(e) => { e.preventDefault(); add(w); }} className="mt-3 flex gap-2">
                  <input value={draft[w.id] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [w.id]: e.target.value }))} placeholder="Add a topic…" className="flex-1 rounded-xl border border-line bg-card px-3 py-2 text-sm outline-none focus:border-deep" />
                  <button className="flex items-center gap-1 rounded-xl bg-deep px-4 text-sm font-medium text-white"><Plus size={15} />Add</button>
                </form>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
