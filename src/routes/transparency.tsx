import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BadgeCheck, Boxes, FileStack, GaugeCircle, Target, Users } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHeader, StatCard } from "@/components/common/StatCard";
import { DataState } from "@/components/common/DataState";
import { analyticsService } from "@/services";

export const Route = createFileRoute("/transparency")({
  head: () => ({
    meta: [
      { title: "Public transparency dashboard — CivicBridge" },
      {
        name: "description",
        content:
          "Public civic accountability figures: problems reported, verified, clustered, converted to challenges, resolved, and people impacted by district and category.",
      },
      { property: "og:title", content: "Public transparency dashboard — CivicBridge" },
      {
        property: "og:description",
        content: "District and category level civic resolution statistics, updated from platform records.",
      },
    ],
  }),
  component: Transparency,
});

const CHART_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

function Transparency() {
  const query = useQuery({ queryKey: ["impact"], queryFn: analyticsService.impact });

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <PageHeader
          eyebrow="Public accountability"
          title="Transparency dashboard"
          description="Aggregate civic figures with no personal information. Every number is computed from platform records — currently seeded demonstration data."
        />

        <div className="mt-8">
          <DataState
            isLoading={query.isLoading}
            isError={query.isError}
            error={query.error}
            data={query.data}
            onRetry={() => void query.refetch()}
            loadingLabel="Loading public figures…"
            skeletonRows={4}
          >
            {(data) => (
              <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <StatCard label="Problems reported" value={data.reported} icon={FileStack} />
                  <StatCard label="Verified" value={data.verified} icon={BadgeCheck} />
                  <StatCard label="Problem clusters" value={data.clustered} icon={Boxes} />
                  <StatCard label="Challenges" value={data.challenges} icon={Target} />
                  <StatCard label="Resolved" value={data.resolved} icon={GaugeCircle} />
                  <StatCard
                    label="People impacted"
                    value={`${data.peopleImpacted.toLocaleString("en-IN")}+`}
                    icon={Users}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard label="Resolution rate" value={`${data.resolutionRatePct}%`} hint="Resolved as a share of all reports" />
                  <StatCard label="Average resolution time" value={`${data.avgResolutionDays} days`} hint="First report to verified resolution" />
                  <StatCard label="Departments engaged" value={data.departmentsEngaged} hint="Departments with at least one challenge" />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <ChartCard title="Problems by category">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={data.byCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                          {data.byCategory.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: 6,
                            color: "var(--color-foreground)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Reported vs resolved by district">
                    <ResponsiveContainer width="100%" height={260}>
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
                        <Legend />
                        <Bar dataKey="reported" fill="var(--color-chart-1)" name="Reported" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="resolved" fill="var(--color-chart-3)" name="Resolved" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Cluster priority distribution">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={data.priorityDistribution}>
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
                        <Bar dataKey="value" fill="var(--color-chart-2)" name="Clusters" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Monthly reporting and resolution trend">
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={data.monthly}>
                        <CartesianGrid stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                        <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: 6,
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="reported" stroke="var(--color-chart-1)" name="Reported" strokeWidth={2} />
                        <Line type="monotone" dataKey="resolved" stroke="var(--color-chart-3)" name="Resolved" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>

                <p className="text-xs text-muted-foreground">
                  No citizen names, contact details or exact home locations are published on this page.
                  District and locality level aggregation only.
                </p>
              </div>
            )}
          </DataState>
        </div>
      </div>
    </PublicLayout>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
