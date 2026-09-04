import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { DataState } from "@/components/common/DataState";
import { PageHeader } from "@/components/common/StatCard";
import { DemoBadge, Pill, ReportStatusBadge } from "@/components/common/StatusBadge";
import { ReportTimeline } from "@/components/common/StatusTimeline";
import { problemService } from "@/services";

export const Route = createFileRoute("/reports/$reportId")({
  head: () => ({
    meta: [
      { title: "Report status — CivicBridge" },
      {
        name: "description",
        content: "Track a civic report through review, verification, clustering, challenge conversion and resolution.",
      },
      { property: "og:title", content: "Report status — CivicBridge" },
      { property: "og:description", content: "A visible timeline for every civic report." },
    ],
  }),
  component: ReportDetail,
});

function ReportDetail() {
  const { reportId } = Route.useParams();
  const query = useQuery({ queryKey: ["problem", reportId], queryFn: () => problemService.get(reportId) });

  return (
    <PublicLayout>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link to="/citizen" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> My reports
        </Link>

        <DataState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          data={query.data}
          onRetry={() => void query.refetch()}
          loadingLabel="Loading report…"
        >
          {(report) => (
            <div className="mt-4 space-y-8">
              <PageHeader eyebrow={report.id} title={report.title} description={report.description} />

              <div className="flex flex-wrap gap-2">
                <ReportStatusBadge status={report.status} />
                <Pill>{report.category}</Pill>
                <Pill>{report.subcategory}</Pill>
                <Pill>
                  {report.locality}, {report.district}
                </Pill>
                <Pill>Severity {report.severity}/5</Pill>
                <Pill>{report.affectedPeople.toLocaleString("en-IN")} affected</Pill>
                {report.demo && <DemoBadge />}
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <section className="rounded-md border border-border bg-card p-5">
                  <h2 className="font-display text-base font-semibold">Status timeline</h2>
                  <div className="mt-4">
                    <ReportTimeline status={report.status} rejectionReason={report.rejectionReason} />
                  </div>
                </section>

                <div className="space-y-6">
                  {report.structured && (
                    <section className="rounded-md border border-border bg-card p-5">
                      <h2 className="font-display text-base font-semibold">Structured interpretation</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Produced by the problem intelligence engine at {Math.round(report.structured.confidence * 100)}%
                        confidence, reviewable by a government officer.
                      </p>
                      <dl className="mt-4 space-y-2 text-sm">
                        {[
                          ["Issues identified", report.structured.issues.join(", ")],
                          ["Severity band", report.structured.severityLabel],
                          ["Affected group", report.structured.affectedGroup],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4 border-b border-border pb-1.5">
                            <dt className="text-muted-foreground">{k}</dt>
                            <dd className="text-right font-medium">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  )}

                  <section className="rounded-md border border-border bg-card p-5">
                    <h2 className="font-display text-base font-semibold">Record</h2>
                    <dl className="mt-3 space-y-2 text-sm">
                      {[
                        ["Reported by", report.reporterName],
                        ["Submitted", new Date(report.createdAt).toLocaleDateString("en-IN")],
                        ["Last updated", new Date(report.updatedAt).toLocaleDateString("en-IN")],
                        ["Evidence items", String(report.evidenceCount)],
                        ["Cluster", report.clusterId ?? "Not yet clustered"],
                        ["Frequency", report.frequency.replace(/_/g, " ")],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 border-b border-border pb-1.5">
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="text-right font-medium">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                </div>
              </div>
            </div>
          )}
        </DataState>
      </div>
    </PublicLayout>
  );
}
