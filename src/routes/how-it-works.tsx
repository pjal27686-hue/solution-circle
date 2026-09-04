import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHeader } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/common/StatusBadge";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How CivicBridge works — problem to public impact" },
      {
        name: "description",
        content:
          "The full CivicBridge lifecycle: report, structure, verify, deduplicate, cluster, prioritise, create a challenge, match teams, execute, verify evidence and measure impact.",
      },
      { property: "og:title", content: "How CivicBridge works" },
      {
        property: "og:description",
        content: "Nineteen steps from a citizen complaint to a verified, measured civic outcome.",
      },
    ],
  }),
  component: HowItWorks,
});

const STAGES = [
  { owner: "Citizen", title: "Problem reported", body: "A citizen describes the problem in their own words, adds location, photos, severity and how many people are affected." },
  { owner: "Platform", title: "Problem structured", body: "The Problem Intelligence Engine converts free text into category, subcategory, issues, severity band and affected group — and shows its confidence." },
  { owner: "Platform", title: "Duplicates detected", body: "Lexical overlap plus geographic proximity flags exact duplicates, highly similar and related reports. Nothing is auto-deleted." },
  { owner: "Government officer", title: "Verification", body: "Officers verify, request more evidence, reject with a reason, merge duplicates and assign a department. Every action is audited." },
  { owner: "Platform", title: "Clustering", body: "Related reports in a locality become one cluster with report count, affected population, spread, evidence count and trend." },
  { owner: "Platform", title: "Priority scoring", body: "Severity, affected population, urgency, evidence, recurrence and equity produce an explainable score — always shown factor by factor." },
  { owner: "Government officer", title: "Challenge creation", body: "A verified cluster becomes an official challenge with expected solution, constraints, skills, budget, timeline, metrics and evidence requirements." },
  { owner: "Platform", title: "Capability matching", body: "Student teams, universities, industry and NGOs are ranked on skills, domain, location, capacity, experience and past performance." },
  { owner: "Student / organization", title: "Application & proposal", body: "Teams submit an approach, timeline, budget, deliverables and risks. One team per challenge can be selected." },
  { owner: "Government", title: "Evaluation & allocation", body: "Applications move through evaluation, shortlist, selection and allocation. Invalid state transitions are blocked by the backend." },
  { owner: "All parties", title: "Project workspace", body: "Team, officer, university coordinator and industry mentor share milestones, tasks, updates and an activity log." },
  { owner: "Team", title: "Evidence submission", body: "Images, documents, progress reports, before/after and completion proof are stored as object-storage keys with metadata in the database." },
  { owner: "Government officer", title: "Completion verification", body: "Officers verify evidence and approve milestones. Only verified completion closes the loop." },
  { owner: "Platform", title: "Impact measurement", body: "Inputs, outputs, outcomes and long-term impact are computed from real records and published on the transparency dashboard." },
];

function HowItWorks() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <PageHeader
          eyebrow="Lifecycle"
          title="How CivicBridge works"
          description="One connected workflow. Each stage has a named owner, a persisted record and an audit entry — the platform does not stop at assigning a project."
        />

        <ol className="mt-8 space-y-4">
          {STAGES.map((stage, i) => (
            <li key={stage.title} className="rounded-md border border-border bg-card p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-sm bg-primary/15 font-mono text-sm text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="font-display text-lg font-semibold">{stage.title}</h2>
                <Pill tone="neutral">{stage.owner}</Pill>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{stage.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/report">
            <Button>
              Report a problem <ArrowRight className="size-4" aria-hidden />
            </Button>
          </Link>
          <Link to="/engines">
            <Button variant="outline">Inspect the five engines</Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
