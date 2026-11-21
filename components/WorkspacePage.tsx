"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Check, Clock3, FileUp, Link2, Maximize, Minimize, Plus, Save, Trash2 } from "lucide-react";
import { deleteLocalFile, readLocalFile, saveLocalFile } from "@/lib/localFiles";

type Entry = { id: string; section: string; kind: string; payload: Record<string, any>; created_at: string };
const input = "w-full rounded-xl border border-line bg-card/80 px-3 py-2.5 text-sm text-ink placeholder:text-muted/70";
const button = "inline-flex items-center justify-center gap-2 rounded-xl bg-deep px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50";
const secondary = "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-card/70 px-3 py-2 text-sm transition hover:bg-bg2";
const aiCurriculum = [
  { title: "Python + software engineering", detail: "Functions, collections, OOP, exceptions, files, iterators, virtual environments, packages, Git/GitHub, testing, debugging and clean project structure." },
  { title: "NumPy + data tools", detail: "Arrays and dtypes; dimensions; indexing/slicing; reshape/transpose; broadcasting; vectorisation; matrix multiplication; random sampling; linear algebra; then Pandas and Matplotlib." },
  { title: "PyTorch", detail: "Tensors and shapes; CPU/GPU tensors; operations; autograd; nn.Module; losses; optimisers; Dataset/DataLoader; training/validation loops; checkpoints and model saving/loading." },
  { title: "Mathematics", detail: "Linear algebra: vectors, matrices, dot products, matrix multiplication, eigenvalues/eigenvectors. Calculus: derivatives, chain rule, partial derivatives, gradients and optimisation. Probability/statistics: conditional probability, Bayes, distributions, expectation, variance and sampling." },
  { title: "Machine learning", detail: "Train/validation/test splits; regression; classification; trees and random forests; KNN; SVM; clustering; PCA; cross-validation; bias/variance; regularisation; precision, recall, F1, ROC/AUC and tuning." },
  { title: "Deep learning", detail: "Neural networks; activations; forward/backpropagation; SGD and Adam; learning-rate schedules; dropout; batch normalisation; CNNs; sequence models; attention and Transformers." },
  { title: "AI application engineering", detail: "REST APIs and FastAPI; databases; model serving; Docker; tests; deployment; logging/monitoring; data pipelines; inference optimisation and reproducibility." },
];
const aiProjects = ["NumPy linear algebra lab", "ML prediction project", "PyTorch neural network", "AI Document Intelligence", "ML model serving platform", "RL Agent Laboratory"];

export default function WorkspacePage({ slug }: { slug: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [subjects, setSubjects] = useState<Entry[]>([]);
  const [habits, setHabits] = useState<{id:string;name:string}[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [busy, setBusy] = useState(true);
  const [localMode, setLocalMode] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [filter, setFilter] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [roomTheme, setRoomTheme] = useState("ice");
  const [roomBlur, setRoomBlur] = useState(0);
  const [roomImage, setRoomImage] = useState("");
  const [fullScreen, setFullScreen] = useState(false);
  const [syllabusBusy, setSyllabusBusy] = useState(false);
  const [syllabusName, setSyllabusName] = useState("");
  const roomRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState({ theme: "light", accent: "#595EB4", daily_focus_minutes: 240, focus: { focus: 50, short: 10, long: 20 } });
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  useEffect(() => {
    let live = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !live) return;
      setUserId(user.id);
      const [e, s, hs, logs, profile, prefs] = await Promise.all([
        (slug === "insights" ? supabase.from("prism_entries").select("id,section,kind,payload,created_at") : supabase.from("prism_entries").select("id,section,kind,payload,created_at").eq("section", slug)).order("created_at", { ascending: false }).limit(100),
        supabase.from("prism_entries").select("id,section,kind,payload,created_at").eq("section", "notes").eq("kind", "subject").order("created_at"),
        supabase.from("habits").select("id,name").eq("archived", false).order("sort"),
        supabase.from("habit_logs").select("habit_id").eq("log_date", today),
        supabase.from("profiles").select("daily_focus_minutes").eq("id", user.id).maybeSingle(),
        supabase.from("user_settings").select("theme,accent,focus").eq("user_id", user.id).maybeSingle(),
      ]);
      if (!live) return;
      if (e.error?.code === "PGRST205") {
        setError("");
        setLocalMode(true);
        const local = readLocalEntries(user.id);
        setEntries(slug === "insights" ? local : local.filter(x => x.section === slug));
        setSubjects(local.filter(x => x.section === "notes" && x.kind === "subject"));
      } else if (e.error) setError(e.error.message);
      else setEntries((e.data ?? []) as Entry[]);
      if (!s.error) setSubjects((s.data ?? []) as Entry[]);
      if (!hs.error) setHabits(hs.data ?? []);
      if (!logs.error) setDone((logs.data ?? []).map(x => x.habit_id));
      const storedAccent = prefs.data?.accent?.toLowerCase() === "#8cbceb" ? "#595EB4" : prefs.data?.accent;
      setSettings(v => ({ ...v, daily_focus_minutes: profile.data?.daily_focus_minutes ?? v.daily_focus_minutes, theme: prefs.data?.theme ?? v.theme, accent: storedAccent ?? v.accent, focus: prefs.data?.focus ?? v.focus }));
      setBusy(false);
    })();
    return () => { live = false; };
  }, [slug, supabase, today]);

  useEffect(() => {
    if (!userId) return;
    let url = "";
    readLocalFile(`focus-background:${userId}`).then(blob => {
      if (blob) { url = URL.createObjectURL(blob); setRoomImage(url); }
    }).catch(() => undefined);
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [userId]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds(s => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    const update = () => setFullScreen(document.fullscreenElement === roomRef.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  async function add(kind: string, payload: Record<string, any>) {
    setError("");
    if (localMode) {
      const row: Entry = { id: crypto.randomUUID(), section: slug, kind, payload, created_at: new Date().toISOString() };
      const all = saveLocalEntry(userId, row);
      setEntries(slug === "insights" ? all : all.filter(x => x.section === slug));
      setTitle(""); setBody(""); setMessage("Saved on this device");
      window.setTimeout(() => setMessage(""), 2200);
      return row;
    }
    const { data, error: e } = await supabase.from("prism_entries").insert({ user_id: userId, section: slug, kind, payload }).select("id,section,kind,payload,created_at").single();
    if (e) { setError(e.message); return null; }
    const row = data as Entry;
    setEntries(prev => [row, ...prev]); setTitle(""); setBody(""); setMessage("Saved to your workspace");
    window.setTimeout(() => setMessage(""), 2200);
    return row;
  }
  async function remove(id: string) {
    const before = localMode ? readLocalEntries(userId) : entries;
    const target = before.find(x => x.id === id);
    if (localMode) {
      const remaining = readLocalEntries(userId).filter(x => x.id !== id);
      if (target?.payload.local_file_key && !remaining.some(x => x.payload.local_file_key === target.payload.local_file_key)) await deleteLocalFile(target.payload.local_file_key);
      const all = saveLocalEntries(userId, remaining);
      setEntries(slug === "insights" ? all : all.filter(x => x.section === slug));
      return;
    }
    const { error: e } = await supabase.from("prism_entries").delete().eq("id", id);
    if (e) setError(e.message); else { setEntries(prev => prev.filter(x => x.id !== id)); if(target?.payload.local_file_key) await deleteLocalFile(target.payload.local_file_key); }
  }
  async function toggleEntry(row: Entry, patch: Record<string, any>) {
    const updated = { ...row, payload: { ...row.payload, ...patch } };
    if (localMode) {
      const all = saveLocalEntries(userId, readLocalEntries(userId).map(x => x.id === row.id ? updated : x));
      setEntries(slug === "insights" ? all : all.filter(x => x.section === slug));
      return;
    }
    const { error: e } = await supabase.from("prism_entries").update({ payload: updated.payload }).eq("id", row.id);
    if (e) setError(e.message); else setEntries(prev => prev.map(x => x.id === row.id ? updated : x));
  }
  async function toggleHabit(id: string) {
    const wasDone = done.includes(id);
    const result = wasDone
      ? await supabase.from("habit_logs").delete().eq("habit_id", id).eq("log_date", today)
      : await supabase.from("habit_logs").insert({ user_id: userId, habit_id: id, log_date: today });
    if (result.error) setError(result.error.message); else setDone(v => wasDone ? v.filter(x => x !== id) : [...v, id]);
  }
  async function finishFocus() {
    setRunning(false);
    if (seconds < 60) return setMessage("A focus session needs at least one minute to save.");
    const { error: e } = await supabase.from("focus_sessions").insert({ user_id: userId, track_slug: "focus", session_type: "focus", planned_seconds: seconds, started_at: new Date(Date.now() - seconds * 1000).toISOString(), ended_at: new Date().toISOString(), duration_seconds: seconds, completed: true });
    if (e) setError(e.message); else setMessage("Focus session saved");
    setSeconds(0);
  }
  async function saveSettings() {
    const [pref, profile] = await Promise.all([
      supabase.from("user_settings").upsert({ user_id: userId, theme: settings.theme, accent: settings.accent, focus: settings.focus, updated_at: new Date().toISOString() }),
      supabase.from("profiles").update({ daily_focus_minutes: settings.daily_focus_minutes }).eq("id", userId),
    ]);
    if (pref.error || profile.error) setError((pref.error ?? profile.error)!.message);
    else { setMessage("Settings saved"); window.location.reload(); }
  }
  async function addSubject() {
    if (!title.trim()) return;
    if (localMode) {
      const row: Entry = { id: crypto.randomUUID(), section: "notes", kind: "subject", payload: { name: title.trim() }, created_at: new Date().toISOString() };
      saveLocalEntry(userId, row); setSubjects(prev => [...prev, row]); setTitle(""); return;
    }
    const { data, error: e } = await supabase.from("prism_entries").insert({ user_id:userId, section:"notes", kind:"subject", payload:{ name:title.trim() } }).select("id,section,kind,payload,created_at").single();
    if (e) setError(e.message); else { setSubjects(v => [...v, data as Entry]); setTitle(""); }
  }
  async function uploadFile(file: File) {
    if (file.size > 25 * 1024 * 1024) { setError("Choose a file smaller than 25 MB."); return; }
    if (localMode) {
      const key = `note:${userId}:${crypto.randomUUID()}`;
      await saveLocalFile(key, file);
      await add("note", { title: title.trim() || file.name, body, subject, file_name: file.name, local_file_key: key, mime: file.type, size: file.size });
      return;
    }
    const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { data, error: e } = await supabase.storage.from("prism-files").upload(path, file, { upsert: false });
    if (e) {
      if (e.message.toLowerCase().includes("bucket") || e.message.toLowerCase().includes("not found")) {
        const key = `note:${userId}:${crypto.randomUUID()}`;
        await saveLocalFile(key, file);
        await add("note", { title: title.trim() || file.name, body, subject, file_name: file.name, local_file_key: key, mime: file.type, size: file.size });
        return;
      }
      setError(e.message); return;
    }
    const { data: url, error: signError } = await supabase.storage.from("prism-files").createSignedUrl(data.path, 60 * 60 * 24 * 365);
    if (signError) { setError(signError.message); return; }
    await add("note", { title: title.trim() || file.name, body, subject, file_name: file.name, storage_path: data.path, file_url: url.signedUrl, mime: file.type, size: file.size });
  }

  async function openLocalFile(key: string) {
    const file = await readLocalFile(key);
    if (!file) { setError("This file is no longer available in this browser."); return; }
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function parseSyllabus(file: File) {
    if (file.size > 25 * 1024 * 1024) { setError("Choose a PDF smaller than 25 MB."); return; }
    setSyllabusBusy(true); setError(""); setSyllabusName(file.name);
    try {
      const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist/legacy/build/pdf.mjs");
      GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const pdf = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      const lines: string[] = [];
      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
        const page = await pdf.getPage(pageNo);
        const content = await page.getTextContent();
        const groups = new Map<number, { x: number; text: string }[]>();
        for (const raw of content.items) {
          if (!("str" in raw) || !raw.str.trim()) continue;
          const y = Math.round(raw.transform[5] / 2);
          const group = groups.get(y) ?? [];
          group.push({ x: raw.transform[4], text: raw.str.trim() }); groups.set(y, group);
        }
        for (const [, group] of [...groups.entries()].sort(([a],[b]) => b-a)) {
          const line = group.sort((a,b) => a.x-b.x).map(x=>x.text).join(" ").replace(/\s+/g," ").trim();
          if (line.length > 3) lines.push(line);
        }
      }
      const heading = /^(?:(?:unit|module|week|chapter|lecture|topic|section|part)\s*(?:[\divx]+|[a-z])?\s*[:.\-–)]?\s*|\d+(?:\.\d+)*[.)]?\s+)/i;
      let topics = [...new Set(lines.filter(line => heading.test(line) && line.length < 150)
        .map(line => line.replace(heading, "").replace(/^[•\-–\s]+/, "").trim())
        .filter(line => line.length > 3 && !/^(syllabus|contents|table of contents|course outcomes|references|bibliography|assessment pattern)$/i.test(line)))];
      if (topics.length < 2) {
        topics = [...new Set(lines.filter(line => line.length >= 8 && line.length <= 90 && /[a-z]/i.test(line) && /[A-Z]/.test(line[0]) && !/^(page\s+\d+|www\.|https?:|semester|course code|institute|university|syllabus)/i.test(line)))].slice(0, 100);
      }
      if (!topics.length) { setError("I couldn’t find clear topic headings in this PDF. Try a text-based syllabus PDF rather than a scanned image."); return; }
      const fileKey = `syllabus:${userId}:${crypto.randomUUID()}`;
      await saveLocalFile(fileKey, file);
      const additions = topics.slice(0, 120).map(topic => ({ section: slug, kind: "syllabus_topic", payload: { title: topic, done: false, file_name: file.name, local_file_key: fileKey } }));
      let count = 0;
      if (localMode) {
        const created = additions.map(row => ({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() } as Entry));
        const all = saveLocalEntries(userId, [...created, ...readLocalEntries(userId)]);
        setEntries(slug === "insights" ? all : all.filter(x => x.section === slug)); count = created.length;
      } else {
        const { data: created, error: createError } = await supabase.from("prism_entries").insert(additions.map(row => ({ ...row, user_id: userId }))).select("id,section,kind,payload,created_at");
        if (createError) throw createError;
        const rows = (created ?? []) as Entry[]; setEntries(prev => [...rows, ...prev]); count = rows.length;
      }
      setMessage(`${count} topics added from ${file.name}`);
    } catch (err) {
      setError(err instanceof Error ? `Could not read this PDF: ${err.message}` : "Could not read this PDF.");
    } finally { setSyllabusBusy(false); }
  }

  const titleText: Record<string,string> = { focus:"Focus Room", rituals:"Daily Rituals", reflections:"Reflections", fitness:"Fitness", scaler:"Scaler Academics", iitm:"IIT Madras BS", insights:"Insights", library:"Library", settings:"Settings", "ai-engineering":"AI Engineering", notes:"Notes" };
  const pageTitle = titleText[slug] ?? "PRISM";
  const card = "glass aurora-card rounded-3xl p-5 shadow-soft";
  const list = entries.filter(x => `${x.payload.title ?? ""} ${x.payload.body ?? ""} ${x.payload.name ?? ""} ${x.payload.subject ?? ""}`.toLowerCase().includes(filter.toLowerCase()) && (slug !== "notes" || !subject || x.payload.subject === subject));
  const form = (children: React.ReactNode) => <form className={`${card} space-y-3`} onSubmit={e => e.preventDefault()}>{children}</form>;

  if (busy) return <div className="aurora-enter"><div className="h-8 w-48 animate-pulse rounded-xl bg-light"/><div className="mt-5 h-40 animate-pulse rounded-3xl bg-light/70"/></div>;
  return <main className="aurora-enter space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-muted">See your progress. Shape your future.</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{pageTitle}</h1></div><div className="flex items-center gap-2">{localMode&&<span className="text-xs text-muted">Workspace entries save on this device</span>}{message && <span role="status" className="rounded-full bg-light px-3 py-1.5 text-sm text-deep">{message}</span>}</div></header>
    {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

    {slug === "focus" && <div ref={roomRef} className={`focus-fullscreen grid min-h-[76vh] gap-5 rounded-3xl lg:grid-cols-[1.3fr_.7fr] ${fullScreen ? "lg:grid-cols-[1fr]" : ""}`}>
      <section className={`${card} focus-fullscreen relative flex min-h-[76vh] flex-col items-center justify-center overflow-hidden text-center`}>
        <div aria-hidden="true" className="absolute inset-0 transition-[filter] duration-500" style={{ background: roomTheme === "ice" ? "linear-gradient(135deg,#d5edff,#a9d2f3,#b7e8ef)" : roomTheme === "lavender" ? "linear-gradient(135deg,#e3ddff,#c6c5f3,#d9e6ff)" : "linear-gradient(135deg,#c9eff2,#9ed9df,#a8cdee)", filter: `blur(${roomBlur}px)`, transform: "scale(1.08)" }} />
        {roomImage && <div aria-hidden="true" className="absolute inset-0 transition-[filter] duration-300" style={{ backgroundImage: `linear-gradient(rgb(15 20 35 / .3),rgb(15 20 35 / .3)),url(${roomImage})`, backgroundSize: "cover", backgroundPosition: "center", filter: `blur(${roomBlur}px)`, transform: "scale(1.08)" }} />}
        <button className={`${secondary} absolute right-4 top-4 z-10`} onClick={async()=>{if(document.fullscreenElement){await document.exitFullscreen();setFullScreen(false)}else{await roomRef.current?.requestFullscreen();setFullScreen(true)}}}>{fullScreen?<Minimize size={16}/>:<Maximize size={16}/>} {fullScreen?"Exit full screen":"Full screen"}</button>
        {roomImage&&<button className={`${secondary} absolute left-4 top-4 z-10`} onClick={async()=>{await deleteLocalFile(`focus-background:${userId}`);setRoomImage("")}}>Remove background image</button>}
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-3 rounded-full bg-card/75 px-3 py-1 text-xs font-semibold text-deep">{running ? "IN A FOCUS SESSION" : "YOUR SPACE TO THINK CLEARLY"}</div>
          <div className="font-mono text-7xl font-light tabular-nums tracking-tight">{`${Math.floor(seconds/3600).toString().padStart(2,"0")}:${Math.floor(seconds/60%60).toString().padStart(2,"0")}:${(seconds%60).toString().padStart(2,"0")}`}</div>
          <p className="mt-3 text-sm text-muted">{running ? "One thing at a time. You’re doing well." : `${settings.focus.focus} min focus · ${settings.focus.short} min break`}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2"><button className={button} onClick={()=>setRunning(x=>!x)}>{running?"Pause":"Start focus"}</button><button className={secondary} onClick={finishFocus}><Check size={16}/>Save session</button><button className={secondary} onClick={()=>{setRunning(false);setSeconds(0)}}>Reset</button><label className={secondary}><FileUp size={16}/>Upload background<input type="file" accept="image/*" className="sr-only" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>10*1024*1024){setError("Choose an image under 10 MB.");return}await saveLocalFile(`focus-background:${userId}`,f);setRoomImage(URL.createObjectURL(f))}}/></label></div>
        </div>
      </section>
      {!fullScreen&&<section className={`${card} space-y-4`}><h2 className="font-semibold">Set up your room</h2><p className="text-sm text-muted">Choose a room color, upload a photo, then soften the background with blur while keeping your timer crisp.</p><div className="grid grid-cols-3 gap-2">{[["Ice","ice","linear-gradient(135deg,#d5edff,#a9d2f3,#b7e8ef)"],["Lavender","lavender","linear-gradient(135deg,#e3ddff,#c6c5f3,#d9e6ff)"],["Ocean","ocean","linear-gradient(135deg,#c9eff2,#9ed9df,#a8cdee)"]].map(([n,key,color])=><button key={key} type="button" onClick={()=>setRoomTheme(key)} aria-pressed={roomTheme===key} className={`relative h-24 rounded-2xl p-3 text-left text-xs font-semibold text-slate-700 transition duration-200 hover:-translate-y-1 hover:shadow-lg ${roomTheme===key?"ring-2 ring-deep ring-offset-2":"ring-1 ring-line"}`} style={{background:color}}>{n}{roomTheme===key&&<span className="absolute right-2 top-2 rounded-full bg-white/80 px-2 py-1 text-[10px] text-deep">Selected</span>}</button>)}</div><label className="block text-sm font-medium">Background blur <span className="text-muted">{roomBlur}px</span><input className="mt-2 w-full" type="range" min="0" max="16" step="1" value={roomBlur} onChange={e=>setRoomBlur(Number(e.target.value))}/></label></section>}
    </div>}

    {slug === "notes" && <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
      <section className={`${card} space-y-3`}><h2 className="font-semibold">Subjects</h2><div className="flex gap-2"><input className={input} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Machine Learning"/><button className={button} onClick={addSubject} aria-label="Add subject"><Plus size={17}/></button></div><div className="space-y-2">{subjects.map(s=><button key={s.id} onClick={()=>setSubject(s.payload.name)} className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${subject===s.payload.name?"border-deep bg-light text-deep":"border-line hover:bg-bg2"}`}>{s.payload.name}</button>)}</div></section>
      <div className="space-y-5">{form(<><h2 className="font-semibold">New note</h2><input className={input} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Note title"/><select className={input} value={subject} onChange={e=>setSubject(e.target.value)}><option value="">Choose a subject</option>{subjects.map(s=><option key={s.id}>{s.payload.name}</option>)}</select><textarea className={`${input} min-h-28`} value={body} onChange={e=>setBody(e.target.value)} placeholder="Capture an idea, class note or reminder…"/><div className="flex flex-wrap gap-2"><button className={button} onClick={()=>add("note",{title:title||"Untitled note",body,subject})}><Save size={16}/>Save note</button><label className={secondary}><FileUp size={16}/>Attach file<input type="file" className="sr-only" onChange={e=>e.target.files?.[0]&&uploadFile(e.target.files[0])}/></label></div><p className="text-xs text-muted">Files are kept privately for your account, or on this device when cloud storage is unavailable.</p></>)}<input className={input} value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search notes"/><EntryList items={list.filter(x=>x.kind==="note")} onRemove={remove} onOpenFile={openLocalFile}/></div>
    </div>}

    {slug === "rituals" && <div className="grid gap-5 lg:grid-cols-2"><section className={`${card} space-y-3`}><h2 className="font-semibold">Today’s rituals · {done.length}/{habits.length}</h2>{habits.map(h=><button key={h.id} onClick={()=>toggleHabit(h.id)} className="flex w-full items-center gap-3 rounded-xl border border-line px-3 py-3 text-left"><span className={`grid h-6 w-6 place-items-center rounded-full border ${done.includes(h.id)?"border-deep bg-deep text-white":"border-line"}`}>{done.includes(h.id)&&<Check size={15}/>}</span>{h.name}</button>)}{!habits.length&&<p className="text-sm text-muted">Create habits from your account’s seeded ritual list.</p>}</section><div className="space-y-5">{form(<><h2 className="font-semibold">Add a ritual</h2><input className={input} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Morning walk"/><button className={button} onClick={async()=>{if(!title.trim())return;const name=title.trim();const {data,error:e}=await supabase.from("habits").insert({user_id:userId,name,category:"Personal",sort:habits.length}).select("id,name").single();if(e)setError(e.message);else{setHabits(v=>[...v,data]);setTitle("")}}}><Plus size={16}/>Add ritual</button></>)}<section className={card}><h2 className="font-semibold">Build a gentle streak</h2><p className="mt-2 text-sm text-muted">Show up consistently, and let small wins compound. Your daily check-ins feed the PRISM activity history.</p></section></div></div>}

    {(slug === "reflections" || slug === "fitness" || slug === "scaler" || slug === "iitm") && <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      {form(<><h2 className="font-semibold">{slug==="reflections"?"Write a reflection":slug==="fitness"?"Log a workout":slug==="scaler"?"Add Scaler coursework":"Add IIT Madras coursework"}</h2><input className={input} type="date" value={today} readOnly/>
      {slug==="reflections"&&<select className={input} value={subject} onChange={e=>setSubject(e.target.value)}><option value="">How are you feeling?</option>{["Energised","Focused","Calm","Tired","Stretched"].map(x=><option key={x}>{x}</option>)}</select>}
      {(slug==="scaler"||slug==="iitm")&&<label className={`${secondary} w-full justify-start`}><FileUp size={16}/>{syllabusBusy?"Reading syllabus…":"Attach syllabus PDF · extract topics automatically"}<input type="file" accept="application/pdf,.pdf" disabled={syllabusBusy} className="sr-only" onChange={e=>e.target.files?.[0]&&parseSyllabus(e.target.files[0])}/></label>}
      {syllabusName&&(slug==="scaler"||slug==="iitm")&&<p className="text-xs text-muted">Current syllabus: {syllabusName}</p>}
      <input className={input} value={title} onChange={e=>setTitle(e.target.value)} placeholder={slug==="fitness"?"Exercise or workout name":slug.includes("scaler")?"Course / subject / assignment":"A thought to remember"}/>
      {slug==="fitness"&&<div className="grid grid-cols-3 gap-2"><input id="sets" type="number" min="1" className={input} placeholder="Sets"/><input id="reps" type="number" min="1" className={input} placeholder="Reps"/><input id="weight" type="number" min="0" step=".5" className={input} placeholder="kg"/></div>}
      {slug!=="fitness"&&slug!=="reflections"&&<div className="grid grid-cols-2 gap-2"><select id="kind" className={input}><option>Lecture</option><option>Assignment</option><option>Quiz</option><option>Exam</option><option>Project</option></select><input id="due" type="date" className={input}/></div>}
      <textarea className={`${input} min-h-28`} value={body} onChange={e=>setBody(e.target.value)} placeholder={slug==="reflections"?"What stood out today? What would you like to carry forward?":"Notes, duration, details or next steps…"}/><button className={button} onClick={()=>add(slug==="fitness"?"workout":slug==="reflections"?"reflection":"coursework",{title:title||"Untitled",body,date:today,mood:subject,sets:(document.getElementById("sets") as HTMLInputElement|null)?.value,reps:(document.getElementById("reps") as HTMLInputElement|null)?.value,weight:(document.getElementById("weight") as HTMLInputElement|null)?.value,kind:(document.getElementById("kind") as HTMLSelectElement|null)?.value,due:(document.getElementById("due") as HTMLInputElement|null)?.value})}><Save size={16}/>Save entry</button></>)}
      <div className="space-y-5">{(slug==="scaler"||slug==="iitm")&&<section className={`${card} space-y-2`}><h2 className="font-semibold">Syllabus checklist</h2>{list.filter(x=>x.kind==="syllabus_topic").map(row=><label key={row.id} className="flex items-start gap-3 rounded-xl px-2 py-2 text-sm hover:bg-bg2"><input type="checkbox" checked={Boolean(row.payload.done)} onChange={e=>toggleEntry(row,{done:e.target.checked})}/><span className={row.payload.done?"text-muted line-through":""}>{row.payload.title}</span><span className="ml-auto text-xs text-muted">{row.payload.file_name}</span></label>)}{!list.some(x=>x.kind==="syllabus_topic")&&<p className="text-sm text-muted">Attach a syllabus PDF above to make your checklist.</p>}</section>}<EntryList items={list.filter(x=>x.kind!=="syllabus_topic")} onRemove={remove} onOpenFile={openLocalFile}/></div>
    </div>}

    {slug === "ai-engineering" && <><div className={`${card} mb-5`}><h2 className="font-semibold">AI engineering foundations</h2><p className="mt-1 text-sm text-muted">The stages and portfolio project ideas follow the supplied AI Engineering + Reinforcement Learning roadmap. Mark a stage complete when you can explain, implement and evaluate it.</p></div><div className="space-y-3">{aiCurriculum.map((stage,i)=>{const item=entries.find(x=>x.kind==="milestone"&&x.payload.title===stage.title);return <button key={stage.title} onClick={()=>item?remove(item.id):add("milestone",{title:stage.title})} className={`${card} flex w-full items-start gap-4 text-left`}><span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${item?"bg-deep text-white":"bg-light text-deep"}`}>{item?<Check size={16}/>:i+1}</span><span><span className="font-semibold">{stage.title}</span><span className="mt-1 block text-sm leading-6 text-muted">{stage.detail}</span></span></button>})}</div><div className={`${card} mt-5`}><h2 className="font-semibold">Portfolio project ideas</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{aiProjects.map(name=><div key={name} className="rounded-xl bg-bg2/70 p-3 text-sm">{name}</div>)}</div><p className="mt-3 text-xs text-muted">Complete and document projects as you learn. The roadmap notes that internship outcomes are not guaranteed.</p></div><div className="mt-4 text-sm text-muted">{entries.filter(x=>x.kind==="milestone").length} of {aiCurriculum.length} foundations complete</div></>}

    {slug === "library" && <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">{form(<><h2 className="font-semibold">Save a resource</h2><input className={input} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Resource title"/><input className={input} value={body} onChange={e=>setBody(e.target.value)} placeholder="Paste a URL"/><input className={input} value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Topic or tag"/><button className={button} onClick={()=>add("resource",{title,body,url:body,tag:subject})}><Link2 size={16}/>Add to library</button><label className={secondary}><FileUp size={16}/>Upload a file<input type="file" className="sr-only" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>12*1024*1024){setError("Choose a file smaller than 12 MB.");return}const path=`${userId}/${crypto.randomUUID()}-${f.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;const {data,error:e2}=await supabase.storage.from("prism-files").upload(path,f);if(e2)setError(e2.message);else{const {data:link,error:signError}=await supabase.storage.from("prism-files").createSignedUrl(data.path,60*60*24*365);if(signError)setError(signError.message);else await add("resource",{title:f.name,body:"",file_name:f.name,storage_path:data.path,file_url:link.signedUrl})}}}/></label></>)}<EntryList items={list} onRemove={remove}/></div>}

    {slug === "insights" && <><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Workspace entries" value={entries.length}/><StatCard label="Rituals completed today" value={`${done.length} / ${habits.length}`}/><StatCard label="AI milestones" value={`${entries.filter(x=>x.kind==="milestone").length} / ${aiCurriculum.length}`}/></div><section className={`${card} mt-5`}><h2 className="font-semibold">Recent activity</h2><div className="mt-4 space-y-2">{entries.slice(0,8).map(x=><div key={x.id} className="flex items-center gap-3 rounded-xl bg-bg2/60 p-3"><Clock3 size={16} className="text-deep"/><span className="text-sm">{x.payload.title ?? x.payload.name ?? x.kind}</span><time className="ml-auto text-xs text-muted">{new Date(x.created_at).toLocaleDateString()}</time></div>)}{!entries.length&&<p className="text-sm text-muted">Your workspace activity will appear here as you add notes, coursework and resources.</p>}</div></section></>}

    {slug === "settings" && <div className="grid gap-5 lg:grid-cols-2">{form(<><h2 className="font-semibold">Appearance</h2><label className="flex items-center justify-between text-sm">Color mode<select className={`${input} ml-4 max-w-48`} value={settings.theme} onChange={e=>setSettings(v=>({...v,theme:e.target.value}))}><option value="light">Aurora light</option><option value="dark">Midnight blue</option></select></label><label className="flex items-center justify-between text-sm">Accent color<input type="color" className="ml-4 h-10 w-16 rounded-lg border border-line bg-card" value={settings.accent} onChange={e=>setSettings(v=>({...v,accent:e.target.value}))}/></label><h2 className="pt-3 font-semibold">Focus sessions</h2>{(["focus","short","long"] as const).map(key=><label key={key} className="flex items-center justify-between gap-4 text-sm capitalize">{key==="focus"?"Focus block":key+" break"}<input type="number" min="1" max="180" className={`${input} max-w-28`} value={settings.focus[key]} onChange={e=>setSettings(v=>({...v,focus:{...v.focus,[key]:Number(e.target.value)}}))}/></label>)}<label className="flex items-center justify-between gap-4 text-sm">Daily focus goal (minutes)<input type="number" min="15" step="15" className={`${input} max-w-28`} value={settings.daily_focus_minutes} onChange={e=>setSettings(v=>({...v,daily_focus_minutes:Number(e.target.value)}))}/></label><button className={button} onClick={saveSettings}><Save size={16}/>Save settings</button></>)}</div>}
  </main>;
}

function EntryList({items,onRemove,onOpenFile}:{items:Entry[];onRemove:(id:string)=>void;onOpenFile?:(key:string)=>void}) {
  return <section className="space-y-3">{items.map(x=><article key={x.id} className="glass aurora-card rounded-2xl p-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><h3 className="font-semibold">{x.payload.title ?? x.payload.file_name ?? x.kind}</h3>{x.payload.subject&&<p className="mt-1 text-xs text-deep">{x.payload.subject}</p>}{x.payload.tag&&<p className="mt-1 text-xs text-deep">{x.payload.tag}</p>}{x.payload.body&&<p className="mt-2 whitespace-pre-wrap text-sm text-muted">{x.payload.body}</p>}{x.payload.file_name&&<p className="mt-2 text-xs text-muted"><BookOpen className="mr-1 inline" size={13}/>{x.payload.file_name}</p>}{(x.payload.file_url||x.payload.url)&&<a className="mt-2 block truncate text-sm text-deep underline" href={x.payload.file_url||x.payload.url} target="_blank" rel="noreferrer">{x.payload.file_url?"Open file":x.payload.url}</a>}{x.payload.local_file_key&&<button className="mt-2 text-sm text-deep underline" onClick={()=>onOpenFile?.(x.payload.local_file_key)}>Open attached file</button>}<time className="mt-2 block text-xs text-muted">{new Date(x.created_at).toLocaleDateString()}</time></div><button className="rounded-lg p-2 text-muted hover:bg-bg2 hover:text-ink" onClick={()=>onRemove(x.id)} aria-label="Delete entry"><Trash2 size={16}/></button></div></article>)}{!items.length&&<div className="glass rounded-2xl p-8 text-center text-sm text-muted">Nothing here yet. Add your first entry to get started.</div>}</section>
}
function StatCard({label,value}:{label:string;value:string|number}) { return <section className="glass aurora-card rounded-3xl p-5"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-3xl font-semibold text-deep">{value}</p></section>; }

function readLocalEntries(userId: string): Entry[] {
  try { return JSON.parse(localStorage.getItem(`prism_entries_v1_${userId}`) ?? "[]") as Entry[]; }
  catch { return []; }
}
function saveLocalEntries(userId: string, rows: Entry[]) {
  localStorage.setItem(`prism_entries_v1_${userId}`, JSON.stringify(rows));
  return rows;
}
function saveLocalEntry(userId: string, row: Entry) {
  return saveLocalEntries(userId, [row, ...readLocalEntries(userId)]);
}
