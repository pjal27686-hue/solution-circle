import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, BadgeCheck, Boxes, Clock, FileStack, Target } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireRole } from "@/hooks/useAuth";
import { PageHeader, StatCard } from "@/components/common/StatCard";
import { DataState } from "@/components/common/DataState";
import { PriorityBadge, ReportStatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { analyticsService, challengeService, clusterService, problemService, referenceService } from "@/services";

export const Route = createFileRoute("/government/")({
  head: () => ({
    meta: [
      { title: "Government dashboard — civic problem oversight" },
      {
        name: "description",
        content:
          "Department-level oversight of reported problems, verification queue, active clusters, challenges, resolution rate and workload.",
      },
      { property: "og:title", content: "Government dashboard — CivicBridge" },
      { property: "og:description", content: "Verification queue, clusters, challenges and department workload." },
    ],
  }),
  component: () => (
    <RequireRole roles={["officer", "gov_admin", "platform_admin", "super_admin"]}>
      <GovernmentDashboard />
    </RequireRole>
  ),
});

function GovernmentDashboard() {
  const impact = useQuery({ queryKey: ["impact"], queryFn: analyticsService.impact });
  const problems = useQuery({ queryKey: ["problems", {}], queryFn: () => problemService.list() });
  const clusters = useQuery({ queryKey: ["clusters"], queryFn: clusterService.list });
  const challenges = useQuery({ queryKey: ["challenges"], queryFn: () => challengeService.list() });
  const departments = useQuery({ queryKey: ["departments"], queryFn: referenceService.departments });

  const pending = (problems.data ?? []).filter((r) => ["submitted", "under_review"].includes(r.status));
  const critical = (clusters.data ?? []).filter((c) => c.priorityScore >= 75);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Government"
        title="Department oversight"
        description="Everything below is computed from the same records citizens and teams see. Every verification action writes an audit entry."
        actions={
          <Link to="/government/review">
            <Button>Open verification queue</Button>
          </Link>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Reported problems" value={impact.data?.reported ?? "—"} icon={FileStack} />
        <StatCard label="Verified problems" value={impact.data?.verified ?? "—"} icon={BadgeCheck} />
        <StatCard label="Awaiting verification" value={pending.length} icon={Clock} hint="Submitted or under review" />
        <StatCard label="Active clusters" value={clusters.data?.length ?? "—"} icon={Boxes} />
        <StatCard label="Critical clusters" value={critical.length} icon={AlertTriangle} hint="Priority 75 and above" />
        <StatCard label="Official challenges" value={challenges.data?.length ?? "—"} icon={Target} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Resolution rate" value={impact.data ? `${impact.data.resolutionRatePct}%` : "—"} />
        <StatCard label="Average resolution time" value={impact.data ? `${impact.data.avgResolutionDays} days` : "—"} />
        <StatCard label="People impacted" value={impact.data ? `${impact.data.peopleImpacted.toLocaleString("en-IN")}+` : "—"} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="font-display text-base font-semibold">Geographic distribution</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Reported and resolved counts by district. A geospatial map layer is planned but not part of this
            prototype.
          </p>
          <DataState
            isLoading={impact.isLoading}
            isError={impact.isError}
            error={impact.error}
            data={impact.data}
            onRetry={() => void impact.refetch()}
            loadingLabel="Loading distribution…"
            skeletonRows={3}
          >
            {(data) => (
              <ResponsiveContainer width="100%" height={260} className="mt-4">
                <BarChart data={data.byDistrict}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 6,
                    }}
                  />
                  <Bar dataKey="reported" name="Reported" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="resolved" name="Resolved" fill="var(--color-chart-3)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </DataState>
        </section>

        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="font-display text-base font-semibold">Department workload</h2>
          <DataState
            isLoading={departments.isLoading}
            isError={departments.isError}
            error={departments.error}
            data={departments.data}
            onRetry={() => void departments.refetch()}
            loadingLabel="Loading departments…"
            isEmpty={(d) => d.length === 0}
            emptyTitle="No departments configured"
            skeletonRows={3}
          >
            {(data) => (
              <ul className="mt-4 space-y-3">
                {data.map((dept) => {
                  const assigned = (challenges.data ?? []).filter((c) => c.departmentId === dept.id).length;
                  return (
                    <li key={dept.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {dept.code} · {dept.district}
                        </p>
                      </div>
                      <span className="rounded-sm bg-primary/15 px-2 py-1 text-xs font-medium tabular-nums text-primary">
                        {assigned} challenges
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </DataState>
        </section>
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Highest priority clusters</h2>
          <Link to="/government/clusters" className="text-sm text-primary hover:underline">
            All clusters
          </Link>
        </div>
        <DataState
          isLoading={clusters.isLoading}
          isError={clusters.isError}
          error={clusters.error}
          data={clusters.data}
          onRetry={() => void clusters.refetch()}
          loadingLabel="Loading clusters…"
          isEmpty={(d) => d.length === 0}
          emptyTitle="No clusters formed yet"
          emptyDescription="Clusters appear once verified reports group together."
        >
          {(data) => (
            <ul className="mt-4 grid gap-3 lg:grid-cols-2">
              {[...data]
                .sort((a, b) => b.priorityScore - a.priorityScore)
                .slice(0, 4)
                .map((cluster) => (
                  <li key={cluster.id} className="rounded-md border border-border bg-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{cluster.id}</span>
                      <PriorityBadge score={cluster.priorityScore} />
                    </div>
                    <h3 className="mt-1.5 font-display text-base font-semibold">{cluster.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {cluster.reportCount} reports · {cluster.affectedPeople.toLocaleString("en-IN")} affected ·{" "}
                      {cluster.locality}, {cluster.district}
                    </p>
                  </li>
                ))}
            </ul>
          )}
        </DataState>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Awaiting verification</h2>
        <DataState
          isLoading={problems.isLoading}
          isError={problems.isError}
          error={problems.error}
          data={pending}
          onRetry={() => void problems.refetch()}
          loadingLabel="Loading queue…"
          isEmpty={(d) => d.length === 0}
          emptyTitle="Verification queue is clear"
          emptyDescription="Newly submitted citizen reports will appear here."
        >
          {(data) => (
            <ul className="mt-4 space-y-2">
              {data.slice(0, 6).map((report) => (
                <li key={report.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-4">
                  <div>
                    <p className="text-sm font-medium">{report.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.id} · {report.locality}, {report.district}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ReportStatusBadge status={report.status} />
                    <Link to="/government/review">
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DataState>
      </section>
    </AppShell>
  );
}
