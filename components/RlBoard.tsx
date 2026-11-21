"use client";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Topic = { number: number; title: string; phase: "classical" | "advanced" | "llm_research"; resources: { order: number; name: string }[]; project: string };
type Prog = { user_id: string; topic_number: number; status: "not_started" | "in_progress" | "done"; completion: number; project_done: boolean; revision_status: "none" | "due" | "revised"; est_hours: number; actual_hours: number; notes: string | null };
const PHASES = [
  { key: "classical", title: "Classical RL", range: "Topics 1–15" },
  { key: "advanced", title: "Advanced RL", range: "Topics 16–44" },
  { key: "llm_research", title: "LLM RL + Research", range: "Topics 45–54" },
] as const;

export default function RlBoard({ topics, progress }: { topics: Topic[]; progress: Prog[] }) {
  const supabase = createClient();
  const [prog, setProg] = useState<Record<number, Prog>>(() => Object.fromEntries(progress.map((p) => [p.topic_number, p])));
  const [open, setOpen] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resourceKey = `prism:rl-resource-checks:${progress[0]?.user_id ?? "guest"}`;
  const [resourceChecks, setResourceChecks] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(resourceKey) ?? "{}"); } catch { return {}; }
  });

  async function patch(n: number, change: Partial<Prog>) {
    const prev = prog[n];
    if (!prev) return setError("Progress row missing for this topic. Re-run migration 003 for your account.");
    setProg((p) => ({ ...p, [n]: { ...prev, ...change } }));
    const { error } = await supabase.from("rl_progress").update(change).eq("topic_number", n);
    if (error) { setProg((p) => ({ ...p, [n]: prev })); setError("Couldn’t save that change."); } else setError(null);
  }
  const setCompletion = (n: number, c: number) => patch(n, { completion: c, status: c === 0 ? "not_started" : c === 100 ? "done" : "in_progress" });
  const setStatus = (n: number, s: Prog["status"]) => patch(n, { status: s, completion: s === "done" ? 100 : s === "not_started" ? 0 : Math.min(Math.max(prog[n]?.completion ?? 0, 1), 99) });
  function toggleResource(key: string) {
    setResourceChecks((checks) => {
      const next = { ...checks, [key]: !checks[key] };
      localStorage.setItem(resourceKey, JSON.stringify(next));
      return next;
    });
  }

  const overall = useMemo(() => Math.round(topics.reduce((a, t) => a + (prog[t.number]?.completion ?? 0), 0) / Math.max(topics.length, 1)), [topics, prog]);
  const next = topics.find((t) => (prog[t.number]?.status ?? "not_started") !== "done");
  const field = "rounded-lg border border-line bg-card px-2 py-1 text-sm outline-none focus:border-deep";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Reinforcement Learning</h1>
        <p className="mt-1 text-sm text-muted">54 topics in original order · {overall}% overall{next ? ` · next: ${next.number}. ${next.title}` : " · complete"}</p>
        <p className="mt-1 text-xs text-muted">RL starts after the DSA sprint. Curriculum text comes from your roadmap PDF and is read-only; your progress, notes and hours are yours.</p>
      </header>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {PHASES.map((ph) => {
        const ts = topics.filter((t) => t.phase === ph.key);
        const pct = Math.round(ts.reduce((a, t) => a + (prog[t.number]?.completion ?? 0), 0) / Math.max(ts.length, 1));
        return (
          <section key={ph.key}>
            <div className="mb-2 flex items-baseline justify-between"><h2 className="text-lg font-semibold">{ph.title} <span className="text-sm font-normal text-muted">{ph.range}</span></h2><span className="text-sm text-deep">{pct}%</span></div>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-light"><div className="h-full rounded-full bg-deep transition-[width]" style={{ width: `${pct}%` }} /></div>
            <div className="glass divide-y divide-line overflow-hidden rounded-3xl shadow-soft">
              {ts.map((t) => {
                const p = prog[t.number];
                const isOpen = open === t.number;
                return (
                  <div key={t.number}>
                    <button onClick={() => setOpen(isOpen ? null : t.number)} aria-expanded={isOpen} className="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-bg2">
                      <span className="w-7 text-sm tabular-nums text-muted">{t.number}</span>
                      <span className="flex-1 text-sm font-medium">{t.title}</span>
                      <span className="text-xs text-muted">{p?.completion ?? 0}%</span>
                      <ChevronDown size={16} className={`text-muted transition ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && p && (
                      <div className="space-y-4 bg-bg2/50 px-5 pb-5 pt-2 text-sm">
                        <div>
                          <p className="mb-1 text-xs font-medium text-muted">Resources, in order</p>
                          <ol className="space-y-1.5">{t.resources.map((r) => { const key = `${t.number}:${r.order}`; return <li key={r.order}><label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 transition hover:bg-card"><input type="checkbox" checked={Boolean(resourceChecks[key])} onChange={() => toggleResource(key)} className="mt-0.5 accent-[rgb(var(--deep))]"/><span className={resourceChecks[key] ? "text-muted line-through" : ""}>{r.name}</span></label></li>; })}</ol>
                        </div>
                        <div><p className="mb-1 text-xs font-medium text-muted">Project</p><p>{t.project}</p>
                          <label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={p.project_done} onChange={(e) => patch(t.number, { project_done: e.target.checked })} />Project built</label></div>
                        <div className="flex flex-wrap items-center gap-4">
                          <label className="flex items-center gap-2">Status
                            <select className={field} value={p.status} onChange={(e) => setStatus(t.number, e.target.value as Prog["status"])}>
                              <option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="done">Done</option>
                            </select></label>
                          <label className="flex items-center gap-2">Completion
                            <input type="range" min={0} max={100} step={5} value={p.completion} onChange={(e) => setProg((x) => ({ ...x, [t.number]: { ...p, completion: Number(e.target.value) } }))} onPointerUp={(e) => setCompletion(t.number, Number((e.target as HTMLInputElement).value))} onKeyUp={(e) => setCompletion(t.number, Number((e.target as HTMLInputElement).value))} />
                            <span className="w-9 tabular-nums">{p.completion}%</span></label>
                          <label className="flex items-center gap-2">Revision
                            <select className={field} value={p.revision_status} onChange={(e) => patch(t.number, { revision_status: e.target.value as Prog["revision_status"] })}>
                              <option value="none">None</option><option value="due">Due</option><option value="revised">Revised</option>
                            </select></label>
                          <label className="flex items-center gap-2">Est h<input type="number" min={0} step={0.5} defaultValue={p.est_hours} onBlur={(e) => patch(t.number, { est_hours: Number(e.target.value) })} className={`${field} w-16 text-right`} /></label>
                          <label className="flex items-center gap-2">Actual h<input type="number" min={0} step={0.5} defaultValue={p.actual_hours} onBlur={(e) => patch(t.number, { actual_hours: Number(e.target.value) })} className={`${field} w-16 text-right`} /></label>
                        </div>
                        <label className="block"><span className="mb-1 block text-xs font-medium text-muted">Notes</span>
                          <textarea rows={3} defaultValue={p.notes ?? ""} onBlur={(e) => e.target.value !== (p.notes ?? "") && patch(t.number, { notes: e.target.value })} className={`${field} w-full`} /></label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
