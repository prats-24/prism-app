import { createClient } from "@/lib/supabase/server";
import RlBoard from "@/components/RlBoard";

export default async function Rl() {
  const supabase = createClient();
  const [t, p] = await Promise.all([
    supabase.from("rl_topics").select("*").order("number"),
    supabase.from("rl_progress").select("*"),
  ]);
  if (t.error || p.error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Couldn’t load the RL roadmap: {(t.error ?? p.error)!.message}</p>;
  return <RlBoard topics={t.data ?? []} progress={p.data ?? []} />;
}
