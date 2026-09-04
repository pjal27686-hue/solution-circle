import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileStack, BadgeCheck, Boxes, CheckCircle2, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireRole } from "@/hooks/useAuth";
import { PageHeader, StatCard } from "@/components/common/StatCard";
import { DataState } from "@/components/common/DataState";
import { DemoBadge, ReportStatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { problemService } from "@/services";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/citizen")({
  head: () => ({
    meta: [
      { title: "My civic reports — CivicBridge citizen portal" },
      {
        name: "description",
        content: "Track every civic problem you reported: status, verification, cluster membership and resolution impact.",
      },
      { property: "og:title", content: "My civic reports — CivicBridge" },
      { property: "og:description", content: "Your personal civic reporting dashboard." },
    ],
  }),
  component: () => (
    <RequireRole roles={["citizen", "platform_admin", "super_admin"]}>
      <CitizenDashboard />
    </RequireRole>
  ),
});

function CitizenDashboard() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["problems", { reporterId: user?.id }],
    queryFn: () => problemService.list(user ? { reporterId: user.id } : {}),
    enabled: Boolean(user),
  });

  const reports = query.data ?? [];
  const counts = {
    total: reports.length,
    verified: reports.filter((r) => ["verified", "clustered", "challenge_created", "assigned", "in_progress", "government_verification", "resolved"].includes(r.status)).length,
    clustered: reports.filter((r) => Boolean(r.clusterId)).length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Citizen portal"
        title={`Welcome, ${user?.name ?? "citizen"}`}
        description="Every report you file is tracked through verification, clustering, challenge conversion and resolution."
        actions={
          <Link to="/report">
            <Button>
              <Plus className="size-4" aria-hidden /> Report a problem
            </Button>
          </Link>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Reports filed" value={counts.total} icon={FileStack} />
        <StatCard label="Verified" value={counts.verified} icon={BadgeCheck} />
        <StatCard label="In a cluster" value={counts.clustered} icon={Boxes} />
        <StatCard label="Resolved" value={counts.resolved} icon={CheckCircle2} />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">My reports</h2>
        <div className="mt-4">
          <DataState
            isLoading={query.isLoading}
            isError={query.isError}
            error={query.error}
            data={query.data}
            onRetry={() => void query.refetch()}
            loadingLabel="Loading your reports…"
            isEmpty={(d) => d.length === 0}
            emptyTitle="No reports yet"
            emptyDescription="File your first civic problem and track it end to end."
            emptyAction={
              <Link to="/report">
                <Button>Report a problem</Button>
              </Link>
            }
          >
            {(data) => (
              <div className="overflow-x-auto rounded-md border border-border bg-card">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="border-b border-border bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Report ID</th>
                      <th className="px-4 py-3 font-semibold">Title</th>
                      <th className="px-4 py-3 font-semibold">Location</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Affected</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((report) => (
                      <tr key={report.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                        <td className="px-4 py-3 font-mono text-xs">
                          <Link to="/reports/$reportId" params={{ reportId: report.id }} className="text-primary hover:underline">
                            {report.id}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2">
                            {report.title}
                            {report.demo && <DemoBadge />}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {report.locality}, {report.district}
                        </td>
                        <td className="px-4 py-3">
                          <ReportStatusBadge status={report.status} />
                        </td>
                        <td className="px-4 py-3 tabular-nums">{report.affectedPeople.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(report.createdAt).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DataState>
        </div>
      </section>
    </AppShell>
  );
}
