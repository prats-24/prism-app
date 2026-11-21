"use client";
import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export type Habit = { id: string; name: string; done: boolean };

export default function HabitChecklist({ habits, today, userId }: { habits: Habit[]; today: string; userId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [items, setItems] = useState(habits);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  async function toggle(h: Habit) {
    setError(null);
    setItems((xs) => xs.map((x) => (x.id === h.id ? { ...x, done: !h.done } : x)));
    const res = h.done
      ? await supabase.from("habit_logs").delete().eq("habit_id", h.id).eq("log_date", today)
      : await supabase.from("habit_logs").upsert({ user_id: userId, habit_id: h.id, log_date: today }, { onConflict: "habit_id,log_date" });
    if (res.error) {
      setItems((xs) => xs.map((x) => (x.id === h.id ? { ...x, done: h.done } : x)));
      setError("Couldn’t save that change. Try again.");
    } else start(() => router.refresh());
  }

  if (items.length === 0) return <p className="text-sm text-muted">No habits yet.</p>;
  return (
    <div>
      <ul className="space-y-1.5">
        {items.map((h) => (
          <li key={h.id}>
            <button onClick={() => toggle(h)} aria-pressed={h.done} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-bg2">
              <span className={`grid h-5 w-5 place-items-center rounded-md border transition ${h.done ? "border-deep bg-deep text-white" : "border-accent bg-card"}`}>{h.done && <Check size={13} strokeWidth={3} />}</span>
              <span className={h.done ? "text-muted line-through" : ""}>{h.name}</span>
            </button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
