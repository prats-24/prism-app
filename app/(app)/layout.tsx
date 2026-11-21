import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Sidebar, { MobileNav } from "@/components/Sidebar";
import PageTransition from "@/components/PageTransition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("display_name,avatar_url,onboarded").eq("id", user.id).maybeSingle(),
    supabase.from("user_settings").select("theme,accent").eq("user_id", user.id).maybeSingle(),
  ]);
  if (!profile) redirect("/onboarding"); // new account whose defaults failed to seed is handled on that page
  if (!profile.onboarded) redirect("/onboarding");
  return (
    <div className={`aurora-theme ${settings?.theme === "dark" ? "dark" : ""}`} style={settings?.accent ? { ["--deep" as string]: hexRgb(settings.accent), ["--accent" as string]: hexRgb(settings.accent) } : undefined}>
      <div className="aurora-shell min-h-screen bg-bg text-ink">
      <div className="relative flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1 pb-20 md:pb-0">
          <div className="mx-auto max-w-6xl px-5 py-6 md:px-10 md:py-10"><PageTransition>{children}</PageTransition></div>
        </div>
      </div>
      </div>
      <MobileNav />
    </div>
  );
}

function hexRgb(value: string) {
  if (value.toLowerCase() === "#8cbceb") value = "#595EB4";
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
  return match ? `${parseInt(match[1],16)} ${parseInt(match[2],16)} ${parseInt(match[3],16)}` : "84 127 175";
}
