import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { STATUS_OPTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*");

  const total = submissions?.length ?? 0;
  const counts = STATUS_OPTIONS.map((status) => ({
    status,
    count: submissions?.filter((s) => s.status === status).length ?? 0,
  }));

  const interviewing = counts.find((c) => c.status === "interviewing")?.count ?? 0;
  const offers = counts.find((c) => c.status === "offer")?.count ?? 0;
  const accepted = counts.find((c) => c.status === "accepted")?.count ?? 0;
  const rejected = counts.find((c) => c.status === "rejected")?.count ?? 0;
  const responded = offers + accepted + rejected;
  const interviewRate = total > 0 ? ((interviewing + offers + accepted) / total * 100).toFixed(1) : "0";
  const offerRate = total > 0 ? ((offers + accepted) / total * 100).toFixed(1) : "0";
  const successRate =
    responded > 0 ? ((offers + accepted) / responded * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stats</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Interview Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{interviewRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Offer Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{offerRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{successRate}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {counts.map(({ status, count }) => {
              const pct = total > 0 ? (count / total * 100).toFixed(1) : "0";
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{status}</span>
                    <span className="text-muted-foreground">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
