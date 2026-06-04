import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .order("applied_at", { ascending: false });

  return <DashboardClient submissions={submissions ?? []} />;
}
