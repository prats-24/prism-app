"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PrismLogo } from "./Logo";

type Mode = "login" | "signup" | "forgot" | "reset";
const copy: Record<Mode, { title: string; cta: string }> = {
  login: { title: "Welcome back", cta: "Sign in" },
  signup: { title: "Create your PRISM", cta: "Create account" },
  forgot: { title: "Reset your password", cta: "Send reset link" },
  reset: { title: "Choose a new password", cta: "Update password" },
};

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    const origin = window.location.origin;
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/"); router.refresh();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${origin}/auth/callback` } });
        if (error) throw error;
        if (data.session) { router.replace("/"); router.refresh(); }
        else setNotice("Check your email to confirm your account, then sign in.");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/reset-password` });
        if (error) throw error;
        setNotice("If that email has an account, a reset link is on its way.");
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        router.replace("/"); router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  async function google() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (error) setError(error.message);
  }

  const input = "w-full rounded-xl border border-line bg-card px-4 py-3 text-sm outline-none transition focus:border-deep focus:ring-2 focus:ring-accent2";
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-bg to-bg2 px-4">
      <div className="glass w-full max-w-md rounded-3xl p-8 shadow-soft">
        <div className="mb-8 flex flex-col items-center text-center">
          <PrismLogo size={44} />
          <p className="mt-3 text-sm text-muted">See your progress. Shape your future.</p>
        </div>
        <h1 className="mb-5 text-xl font-semibold">{copy[mode].title}</h1>
        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && <input className={input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />}
          {mode !== "reset" && <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />}
          {mode !== "forgot" && <input className={input} type="password" placeholder={mode === "reset" ? "New password" : "Password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required />}
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="rounded-lg bg-light px-3 py-2 text-sm text-deep">{notice}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-deep py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">{busy ? "Please wait…" : copy[mode].cta}</button>
        </form>
        {(mode === "login" || mode === "signup") && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
            <button onClick={google} type="button" className="w-full rounded-xl border border-line bg-card py-3 text-sm font-medium transition hover:bg-light">Continue with Google</button>
          </>
        )}
        <div className="mt-6 flex justify-between text-sm text-muted">
          {mode === "login" && <><Link className="hover:text-deep" href="/forgot-password">Forgot password?</Link><Link className="hover:text-deep" href="/signup">Create account</Link></>}
          {mode === "signup" && <Link className="hover:text-deep" href="/login">Already have an account? Sign in</Link>}
          {(mode === "forgot" || mode === "reset") && <Link className="hover:text-deep" href="/login">Back to sign in</Link>}
        </div>
      </div>
    </main>
  );
}
