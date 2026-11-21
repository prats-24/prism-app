"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Binary, Cpu, Route, GraduationCap, BookOpen, Timer, CheckCheck, Dumbbell, NotebookPen, ChartLine, Library, Settings, PanelLeftClose, PanelLeftOpen, LogOut, StickyNote, Moon, Sun } from "lucide-react";
import { PrismLogo, PrismMark } from "./Logo";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/dsa", label: "DSA", icon: Binary },
  { href: "/ai-engineering", label: "AI Engineering", icon: Cpu },
  { href: "/reinforcement-learning", label: "Reinforcement Learning", icon: Route },
  { href: "/scaler", label: "Scaler Academics", icon: GraduationCap },
  { href: "/iitm", label: "IIT Madras BS", icon: BookOpen },
  { href: "/focus", label: "PRISM Focus", icon: Timer },
  { href: "/rituals", label: "Daily Rituals", icon: CheckCheck },
  { href: "/fitness", label: "Fitness", icon: Dumbbell },
  { href: "/reflections", label: "Reflections", icon: NotebookPen },
  { href: "/insights", label: "Insights", icon: ChartLine },
  { href: "/library", label: "Library", icon: Library },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  useEffect(() => { setIsDark(document.querySelector(".aurora-theme")?.classList.contains("dark") ?? false); }, []);
  async function signOut() { await createClient().auth.signOut(); router.replace("/login"); router.refresh(); }
  async function toggleTheme() {
    const root = document.querySelector(".aurora-theme");
    const next = !root?.classList.contains("dark");
    root?.classList.toggle("dark", next);
    setIsDark(next);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("user_settings").upsert({ user_id: user.id, theme: next ? "dark" : "light", updated_at: new Date().toISOString() });
    if (error) { root?.classList.toggle("dark", !next); setIsDark(!next); return; }
    router.refresh();
  }
  return (
    <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-card/60 p-3 backdrop-blur transition-[width] md:flex ${collapsed ? "w-[72px]" : "w-64"}`}>
      <div className={`sidebar-brand flex items-center ${collapsed ? "justify-center" : "justify-start"}`}>
        {collapsed ? <span className="grid h-11 w-11 place-items-center rounded-2xl bg-card shadow-soft"><PrismMark size={34} /></span> : <div className="flex min-w-0 items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-card shadow-soft"><PrismMark size={38} /></span><span className="min-w-0 rounded-xl border border-line/80 bg-card/75 px-3 py-2"><span className="block text-[15px] font-bold tracking-[.28em] text-deep">PRISM</span><span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[.15em] text-muted">Personal life OS</span></span></div>}
      </div>
      <nav className="mt-2 flex-1 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href} title={label} aria-current={active ? "page" : undefined}
              className={`sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active ? "bg-light font-semibold text-deep" : "text-muted"} ${collapsed ? "justify-center" : ""}`}>
              <Icon size={18} strokeWidth={1.8} />{!collapsed && label}
            </Link>
          );
        })}
      </nav>
      <div className={`flex gap-1 pt-2 ${collapsed ? "flex-col items-center" : "justify-between"}`}>
        <button onClick={toggleTheme} title={isDark ? "Switch to light mode" : "Switch to dark mode"} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} className="rounded-xl p-2.5 text-muted hover:bg-bg2 hover:text-ink">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
        <button onClick={signOut} title="Sign out" className="rounded-xl p-2.5 text-muted hover:bg-bg2 hover:text-ink"><LogOut size={18} /></button>
        <button onClick={() => setCollapsed((c) => !c)} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="rounded-xl p-2.5 text-muted hover:bg-bg2 hover:text-ink">
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const path = usePathname();
  const items = [NAV[0], NAV[1], NAV[3], NAV[7], NAV[13]];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-card/90 px-2 py-2 backdrop-blur md:hidden" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] ${active ? "text-deep" : "text-muted"}`}><Icon size={20} strokeWidth={1.8} />{label.split(" ")[0]}</Link>;
      })}
    </nav>
  );
}
