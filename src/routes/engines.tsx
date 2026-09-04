import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Boxes, FileSearch, Repeat, Scale, Users } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHeader, FactorBar } from "@/components/common/StatCard";
import { Pill, PriorityBadge } from "@/components/common/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
import { structureProblem } from "@/lib/engines/structuring";
import { findDuplicates } from "@/lib/engines/duplicates";
import { computePriority } from "@/lib/engines/priority";
import { demoReports } from "@/data/demo";

export const Route = createFileRoute("/engines")({
  head: () => ({
    meta: [
      { title: "The five CivicBridge engines — explainable civic intelligence" },
      {
        name: "description",
        content:
          "Problem intelligence, civic clustering, transparent priority, capability matching and the impact loop — with a live, inspectable demonstration.",
      },
      { property: "og:title", content: "The five CivicBridge engines" },
      {
        property: "og:description",
        content: "Try the problem structuring and duplicate detection engines on your own text.",
      },
    ],
  }),
  component: Engines,
});

const ENGINES = [
  { icon: FileSearch, title: "Problem Intelligence Engine", body: "Unstructured citizen complaints become structured problems: category, subcategory, issues, severity band, affected group and a confidence value." },
  { icon: Boxes, title: "Civic Clustering Engine", body: "Many individual complaints in one locality become one meaningful problem cluster with population, spread, evidence and trend." },
  { icon: Scale, title: "Transparent Priority Engine", body: "A weighted, normalised score over six factors. The breakdown is always visible — never an unexplained AI number." },
  { icon: Users, title: "Capability Matching Engine", body: "Teams are ranked on skills, domain, location, capacity, experience and past performance, with each factor explained." },
  { icon: Repeat, title: "Impact Loop", body: "Problem → intervention → output → outcome → impact, computed from verified project records rather than declared." },
];

function Engines() {
  const [text, setText] = useState(
    "Road is broken near our school and during rain water stays there for days. Students walk through dirty water.",
  );

  const structured = useMemo(() => structureProblem({ text }), [text]);
  const duplicates = useMemo(
    () =>
      findDuplicates(
        { title: text.slice(0, 60), description: text, category: structured.category, district: "Pune", locality: "Kothrud" },
        demoReports,
      ),
    [text, structured.category],
  );
  const priority = useMemo(
    () =>
      computePriority({
        severity: structured.severityLabel === "Critical" ? 5 : structured.severityLabel === "High" ? 4 : 3,
        affectedPeople: 4200,
        urgencyDays: 30,
        evidenceCount: 4,
        recurrenceCount: duplicates.length + 1,
        vulnerability: 5,
      }),
    [structured.severityLabel, duplicates.length],
  );

  return (
    <PublicLayout>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <PageHeader
          eyebrow="Intelligence layer"
          title="The five engines"
          description="No paid AI API is used. These engines are deterministic, open, keyword and geometry based methods — you can read every factor that produced a result."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {ENGINES.map((engine) => (
            <div key={engine.title} className="rounded-md border border-border bg-card p-5">
              <engine.icon className="size-5 text-accent" aria-hidden />
              <h2 className="mt-3 font-display text-base font-semibold">{engine.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{engine.body}</p>
            </div>
          ))}
        </div>

        <section className="mt-12 rounded-md border border-border bg-card p-6">
          <h2 className="font-display text-xl font-semibold">Try it on your own text</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything below is computed in real time from what you type — against the seeded demonstration
            report set for the Kothrud, Pune area.
          </p>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="mt-4"
            aria-label="Problem description"
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                1 · Structured output
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                {[
                  ["Category", structured.category],
                  ["Subcategory", structured.subcategory],
                  ["Issues", structured.issues.join(", ")],
                  ["Severity", structured.severityLabel],
                  ["Affected group", structured.affectedGroup],
                  ["Confidence", `${Math.round(structured.confidence * 100)}%`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-border pb-1.5">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {structured.keywords.map((k) => (
                  <Pill key={k}>{k}</Pill>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                2 · Similar existing reports
              </h3>
              {duplicates.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No similar problems found near this location — this would be filed as a new report.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {duplicates.map((d) => (
                    <li key={d.reportId} className="rounded-sm border border-border bg-surface p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{d.reportId}</span>
                        <Pill tone={d.verdict === "exact_duplicate" ? "danger" : d.verdict === "highly_similar" ? "warning" : "info"}>
                          {d.verdict.replace(/_/g, " ")} · {Math.round(d.similarity * 100)}%
                        </Pill>
                      </div>
                      <p className="mt-1 text-sm">{d.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{d.reasons.join(" · ")}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                3 · Priority score, factor by factor
              </h3>
              <PriorityBadge score={priority.score} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {priority.breakdown.map((f) => (
                <FactorBar
                  key={f.label}
                  label={f.label}
                  detail={f.detail}
                  valuePct={f.normalized * 100}
                  weightPct={f.weight * 100}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
