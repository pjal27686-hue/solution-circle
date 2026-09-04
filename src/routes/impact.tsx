import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHeader, StatCard } from "@/components/common/StatCard";
import { DataState } from "@/components/common/DataState";
import { analyticsService } from "@/services";

export const Route = createFileRoute("/impact")({
  head: () => ({
    meta: [
      { title: "Impact analytics — inputs, outputs, outcomes — CivicBridge" },
      {
        name: "description",
        content:
          "The CivicBridge impact loop: inputs, outputs, outcomes and long-term impact measured from verified civic projects.",
      },
      { property: "og:title", content: "Impact analytics — CivicBridge" },
      {
        property: "og:description",
        content: "See how citizen problems convert into verified interventions and measurable outcomes.",
      },
    ],
  }),
  component: Impact,
});

function Impact() {
  const query = useQuery({ queryKey: ["impact"], queryFn: analyticsService.impact });

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <PageHeader
          eyebrow="Impact loop"
          title="Impact analytics"
          description="The platform does not stop at allocating a project. Every stage from input to long-term impact is measured from records."
        />

        <div className="mt-8">
          <DataState
            isLoading={query.isLoading}
            isError={query.isError}
            error={query.error}
            data={query.data}
            onRetry={() => void query.refetch()}
            loadingLabel="Loading impact metrics…"
            skeletonRows={4}
          >
            {(data) => (
              <div className="space-y-10">
                {/* Funnel */}
                <section>
                  <h2 className="font-display text-lg font-semibold">Impact funnel</h2>
                  <ol className="mt-4 grid gap-3 sm:grid-cols-5">
                    {[
                      { label: "Problem", value: data.reported, hint: "citizen reports" },
                      { label: "Intervention", value: data.challenges, hint: "official challenges" },
                      { label: "Output", value: data.projects, hint: "projects executing" },
                      { label: "Outcome", value: data.resolved, hint: "problems resolved" },
                      { label: "Impact", value: `${data.peopleImpacted.toLocaleString("en-IN")}+`, hint: "people impacted" },
                    ].map((step, i, arr) => (
                      <li key={step.label} className="relative rounded-md border border-border bg-card p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{step.label}</p>
                        <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{step.value}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{step.hint}</p>
                        {i < arr.length - 1 && (
                          <ArrowRight
                            className="absolute -right-4 top-1/2 hidden size-4 -translate-y-1/2 text-muted-foreground sm:block"
                            aria-hidden
                          />
                        )}
                      </li>
                    ))}
                  </ol>
                </section>

                <Group
                  title="Inputs"
                  description="What entered the system."
                  items={[
                    { label: "Problems reported", value: data.reported },
                    { label: "Problem clusters formed", value: data.clustered },
                    { label: "Departments engaged", value: data.departmentsEngaged },
                  ]}
                />
                <Group
                  title="Outputs"
                  description="What the ecosystem produced."
                  items={[
                    { label: "Official challenges", value: data.challenges },
                    { label: "Projects allocated", value: data.projects },
                    { label: "Problems verified", value: data.verified },
                  ]}
                />
                <Group
                  title="Outcomes"
                  description="What changed on the ground."
                  items={[
                    { label: "Problems resolved", value: data.resolved },
                    { label: "Resolution rate", value: `${data.resolutionRatePct}%` },
                    { label: "Average resolution time", value: `${data.avgResolutionDays} days` },
                  ]}
                />
                <Group
                  title="Long-term impact"
                  description="Whether the problem stays solved."
                  items={[
                    { label: "People impacted", value: `${data.peopleImpacted.toLocaleString("en-IN")}+` },
                    { label: "Recurring issue closure", value: `${data.recurringIssueReductionPct}%` },
                    { label: "Citizen satisfaction", value: `${data.citizenSatisfactionPct}%` },
                  ]}
                />

                <p className="text-xs text-muted-foreground">
                  Citizen satisfaction is a placeholder indicator in this prototype: the survey pipeline that
                  would populate it is designed but not yet collecting responses. Every other figure on this
                  page is computed from platform records.
                </p>
              </div>
            )}
          </DataState>
        </div>
      </div>
    </PublicLayout>
  );
}

function Group({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: { label: string; value: string | number }[];
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </section>
  );
}
