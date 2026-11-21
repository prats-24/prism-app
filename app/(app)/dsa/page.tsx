import { createClient } from "@/lib/supabase/server";
import DsaBoard from "@/components/DsaBoard";

export default async function Dsa() {
  const supabase = createClient();
  const [w, t] = await Promise.all([
    supabase.from("dsa_weeks").select("*").order("sort"),
    supabase.from("dsa_topics").select("*").order("sort"),
  ]);
  if (w.error || t.error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Couldn’t load the DSA roadmap: {(w.error ?? t.error)!.message}</p>;
  return <DsaBoard weeks={w.data ?? []} topics={t.data ?? []} />;
}
