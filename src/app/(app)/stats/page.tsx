import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { STATUS_OPTIONS, type SubmissionStatus } from "@/lib/constants";
import { BarChart3, Send, MessageSquare, XCircle, CheckCircle, Award } from "lucide-react";

const statusIcons: Record<string, typeof BarChart3> = {
  sent: Send,
  interviewing: MessageSquare,
  rejected: XCircle,
  offer: Award,
  accepted: CheckCircle,
};

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false });

  if (!submissions || submissions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Stats</h1>
        <p className="text-sm text-muted-foreground">
          No data yet. Add some applications first.
        </p>
      </div>
    );
  }

  const total = submissions.length;

  const counts = STATUS_OPTIONS.reduce(
    (acc, status) => {
      acc[status] = submissions.filter((s) => s.status === status).length;
      return acc;
    },
    {} as Record<string, number>
  );

  const interviewCount = counts["interviewing"] + counts["offer"] + counts["accepted"];
  const offerCount = counts["offer"] + counts["accepted"];
  const acceptanceRate = total > 0 ? Math.round((offerCount / total) * 100) : 0;
  const interviewRate = total > 0 ? Math.round((interviewCount / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold tracking-tight">Stats</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Send className="h-4 w-4" />
            Total
          </div>
          <p className="mt-1 text-2xl font-semibold">{total}</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            Interview rate
          </div>
          <p className="mt-1 text-2xl font-semibold">{interviewRate}%</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="h-4 w-4" />
            Offer rate
          </div>
          <p className="mt-1 text-2xl font-semibold">{acceptanceRate}%</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Status breakdown
        </h2>
        {STATUS_OPTIONS.map((status) => {
          const count = counts[status];
          const pct = total > 0 ? (count / total) * 100 : 0;
          const colorMap: Record<string, string> = {
            sent: "bg-[var(--status-sent-fg)]",
            interviewing: "bg-[var(--status-interviewing-fg)]",
            rejected: "bg-[var(--status-rejected-fg)]",
            offer: "bg-[var(--status-offer-fg)]",
            accepted: "bg-[var(--status-accepted-fg)]",
          };
          const Icon = statusIcons[status] || BarChart3;

          return (
            <div
              key={status}
              className="rounded-lg border px-4 py-3"
            >
              <div className="mb-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {count}/{total}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${colorMap[status]} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
