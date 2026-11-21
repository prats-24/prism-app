import { notFound } from "next/navigation";
import WorkspacePage from "@/components/WorkspacePage";

const pages = new Set(["ai-engineering", "scaler", "iitm", "focus", "rituals", "fitness", "reflections", "insights", "library", "settings", "notes"]);

export default function Section({ params }: { params: { slug: string } }) {
  if (!pages.has(params.slug)) notFound();
  return <WorkspacePage slug={params.slug} />;
}
