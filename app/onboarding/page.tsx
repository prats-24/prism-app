"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PrismLogo } from "@/components/Logo";

export default function Onboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [uid, setUid] = useState<string | null>(null);
  const [f, setF] = useState({ display_name: "", intro: "", academic_goals: "", learning_goals: "", fitness_goals: "", daily_focus_hours: 4, theme: "light" });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.replace("/login");
      setUid(data.user.id);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      if (p?.onboarded) router.replace("/");
      if (p) setF((x) => ({ ...x, display_name: p.display_name ?? "", intro: p.intro ?? "", academic_goals: p.academic_goals ?? "", learning_goals: p.learning_goals ?? "", fitness_goals: p.fitness_goals ?? "", daily_focus_hours: (p.daily_focus_minutes ?? 240) / 60 }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    setBusy(true); setError(null);
    try {
      let avatar_url: string | undefined;
      if (avatar) {
        const ext = avatar.name.split(".").pop() || "png";
        const path = `${uid}/avatar-${Date.now()}.${ext}`;
        const up = await supabase.storage.from("avatars").upload(path, avatar, { upsert: true });
        if (up.error) throw up.error;
        avatar_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }
      const { error: pe } = await supabase.from("profiles").upsert({
        id: uid, display_name: f.display_name, intro: f.intro, academic_goals: f.academic_goals,
        learning_goals: f.learning_goals, fitness_goals: f.fitness_goals,
        daily_focus_minutes: Math.round(f.daily_focus_hours * 60), onboarded: true, ...(avatar_url ? { avatar_url } : {}),
      });
      if (pe) throw pe;
      const { error: se } = await supabase.from("user_settings").upsert({ user_id: uid, theme: f.theme });
      if (se) throw se;
      router.replace("/"); router.refresh();
    } catch (err) {
      console.error(err); setError((err as { message?: string })?.message ?? "Could not save your profile.");
    } finally { setBusy(false); }
  }

  const field = "w-full rounded-xl border border-line bg-card px-4 py-3 text-sm outline-none transition focus:border-deep focus:ring-2 focus:ring-accent2";
  const label = "mb-1.5 block text-sm font-medium";
  return (
    <main className="min-h-screen bg-gradient-to-b from-bg to-bg2 px-4 py-10">
      <form onSubmit={save} className="glass mx-auto max-w-xl space-y-5 rounded-3xl p-8 shadow-soft">
        <PrismLogo size={36} />
        <div><h1 className="text-2xl font-semibold">Let’s set up your PRISM</h1><p className="mt-1 text-sm text-muted">Everything here can be changed later.</p></div>
        <div><label className={label} htmlFor="n">Name</label><input id="n" className={field} value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} required /></div>
        <div><label className={label} htmlFor="a">Profile picture</label><input id="a" type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] ?? null)} className="text-sm" /></div>
        <div><label className={label} htmlFor="i">About you</label><textarea id="i" rows={2} className={field} value={f.intro} onChange={(e) => setF({ ...f, intro: e.target.value })} /></div>
        <div><label className={label} htmlFor="ac">Academic goals</label><textarea id="ac" rows={2} className={field} value={f.academic_goals} onChange={(e) => setF({ ...f, academic_goals: e.target.value })} /></div>
        <div><label className={label} htmlFor="l">Learning goals</label><textarea id="l" rows={2} className={field} value={f.learning_goals} onChange={(e) => setF({ ...f, learning_goals: e.target.value })} /></div>
        <div><label className={label} htmlFor="fi">Fitness goals</label><textarea id="fi" rows={2} className={field} value={f.fitness_goals} onChange={(e) => setF({ ...f, fitness_goals: e.target.value })} /></div>
        <div><label className={label} htmlFor="d">Daily focus target (hours)</label><input id="d" type="number" min={0.5} max={16} step={0.5} className={field} value={f.daily_focus_hours} onChange={(e) => setF({ ...f, daily_focus_hours: Number(e.target.value) })} /></div>
        <fieldset><legend className={label}>Appearance</legend>
          <div className="flex gap-3">{["light", "dark"].map((t) => (
            <label key={t} className={`flex-1 cursor-pointer rounded-xl border px-4 py-3 text-center text-sm capitalize ${f.theme === t ? "border-deep bg-light font-semibold text-deep" : "border-line bg-card"}`}>
              <input type="radio" name="theme" value={t} className="sr-only" checked={f.theme === t} onChange={() => setF({ ...f, theme: t })} />{t === "light" ? "Icy Blue (light)" : "Midnight (dark)"}
            </label>))}</div>
        </fieldset>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button disabled={busy || !uid} className="w-full rounded-xl bg-deep py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Saving…" : "Enter PRISM"}</button>
      </form>
    </main>
  );
}
