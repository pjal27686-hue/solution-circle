import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  FileSearch,
  GaugeCircle,
  GraduationCap,
  Landmark,
  LineChart,
  Scale,
  Users,
  Wrench,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { DataState } from "@/components/common/DataState";
import { PriorityBadge, ChallengeStatusBadge, Pill } from "@/components/common/StatusBadge";
import { analyticsService, challengeService, problemService } from "@/services";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CivicBridge — From citizen problems to verified solutions" },
      {
        name: "description",
        content:
          "Report a civic problem, watch it get verified, clustered and prioritised, then solved by matched student and industry teams with government verification.",
      },
      { property: "og:title", content: "CivicBridge — From citizen problems to verified solutions" },
      {
        property: "og:description",
        content:
          "A collaborative civic platform connecting citizens, government, students, universities and organizations to deliver measurable public impact.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { icon: FileSearch, title: "Report", body: "A citizen describes the problem in their own words with photos and location." },
  { icon: BadgeCheck, title: "Verify", body: "Government officers inspect, verify, request evidence or reject with a reason." },
  { icon: Boxes, title: "Cluster", body: "Related reports across a locality are grouped into one meaningful problem." },
  { icon: Scale, title: "Prioritise", body: "A transparent score explains why one cluster is taken up before another." },
  { icon: Wrench, title: "Match & solve", body: "Capability matching connects student, university and industry teams." },
  { icon: LineChart, title: "Measure impact", body: "Evidence, verification and outcome metrics close the loop publicly." },
];

const STAKEHOLDERS = [
  { icon: Users, title: "Citizens", body: "Report problems, track status on a visible timeline, see resolution evidence." },
  { icon: Landmark, title: "Government", body: "Verified intake, explainable priorities, department workload and audit trails." },
  { icon: GraduationCap, title: "Students & universities", body: "Real civic challenges, matched by capability, with recognised impact." },
  { icon: Building2, title: "Industry & NGOs", body: "Mentor teams, contribute expertise, track outcomes in the field." },
];

function Landing() {
  const impact = useQuery({ queryKey: ["impact"], queryFn: analyticsService.impact });
  const challenges = useQuery({ queryKey: ["challenges"], queryFn: () => challengeService.list() });
  const resolved = useQuery({
    queryKey: ["problems", { status: "resolved" }],
    queryFn: () => problemService.list({ status: "resolved" }),
  });

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <Pill tone="primary">Smart India Hackathon 2026 · Civic Governance</Pill>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] text-balance-tight sm:text-5xl lg:text-6xl">
              From citizen problems to verified solutions.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              A collaborative platform connecting citizens, government, students, universities and
              organizations to turn real-world problems into measurable public impact.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/report">
                <Button size="lg">
                  Report a problem <ArrowRight className="size-4" aria-hidden />
                </Button>
              </Link>
              <Link to="/challenges">
                <Button size="lg" variant="outline">
                  Explore challenges
                </Button>
              </Link>
            </div>
            <p className="mt-6 max-w-lg text-xs text-muted-foreground">
              Prototype build. The intelligence layer uses transparent, open-source style heuristics —
              every score on this platform can be opened and inspected factor by factor.
            </p>
          </div>

          <div className="rounded-md border border-border bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Live platform figures
            </p>
            <DataState
              isLoading={impact.isLoading}
              isError={impact.isError}
              error={impact.error}
              data={impact.data}
              onRetry={() => void impact.refetch()}
              loadingLabel="Loading platform figures…"
              skeletonRows={4}
            >
              {(data) => (
                <dl className="mt-4 grid grid-cols-2 gap-4">
                  {[
                    { label: "Problems reported", value: data.reported },
                    { label: "Verified", value: data.verified },
                    { label: "Problem clusters", value: data.clustered },
                    { label: "Official challenges", value: data.challenges },
                    { label: "Resolved", value: data.resolved },
                    { label: "People impacted", value: `${data.peopleImpacted.toLocaleString("en-IN")}+` },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-sm border border-border bg-card p-3">
                      <dd className="font-display text-2xl font-semibold tabular-nums">{stat.value}</dd>
                      <dt className="mt-0.5 text-xs text-muted-foreground">{stat.label}</dt>
                    </div>
                  ))}
                </dl>
              )}
            </DataState>
            <Link to="/transparency" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              Open the public transparency dashboard <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">How it works</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          One workflow, six stages. Every stage has an owner, a record and an audit trail.
        </p>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-md border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-sm bg-primary/15 text-primary">
                  <step.icon className="size-4.5" aria-hidden />
                </span>
                <p className="font-display text-base font-semibold">
                  {i + 1}. {step.title}
                </p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
        <Link to="/how-it-works" className="mt-6 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          See the full lifecycle <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </section>

      {/* Featured challenges */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">Active challenges</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Official challenges created from verified citizen problem clusters.
              </p>
            </div>
            <Link to="/challenges">
              <Button variant="outline" size="sm">
                View all challenges
              </Button>
            </Link>
          </div>

          <DataState
            isLoading={challenges.isLoading}
            isError={challenges.isError}
            error={challenges.error}
            data={challenges.data}
            isEmpty={(d) => d.length === 0}
            onRetry={() => void challenges.refetch()}
            loadingLabel="Loading challenges…"
            emptyTitle="No challenges published yet"
          >
            {(data) => (
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {data.slice(0, 3).map((challenge) => (
                  <Link
                    key={challenge.id}
                    to="/challenges/$challengeId"
                    params={{ challengeId: challenge.id }}
                    className="group flex flex-col rounded-md border border-border bg-surface p-5 transition-colors hover:border-primary/60"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <ChallengeStatusBadge status={challenge.status} />
                      <PriorityBadge score={challenge.priorityScore} />
                    </div>
                    <p className="mt-3 font-mono text-xs text-muted-foreground">{challenge.code}</p>
                    <h3 className="mt-1 font-display text-lg font-semibold group-hover:text-primary">
                      {challenge.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{challenge.problemStatement}</p>
                    <p className="mt-4 text-xs text-muted-foreground">
                      {challenge.district}, {challenge.state} · {challenge.affectedPeople.toLocaleString("en-IN")} people
                      affected
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </DataState>
        </div>
      </section>

      {/* Recent impact */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">Recently resolved</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Problems closed after evidence submission and government verification.
        </p>
        <DataState
          isLoading={resolved.isLoading}
          isError={resolved.isError}
          error={resolved.error}
          data={resolved.data}
          isEmpty={(d) => d.length === 0}
          onRetry={() => void resolved.refetch()}
          loadingLabel="Loading resolved problems…"
          emptyTitle="No resolved problems yet"
          emptyDescription="Resolved problems appear here once government verification is complete."
        >
          {(data) => (
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {data.slice(0, 4).map((report) => (
                <li key={report.id} className="rounded-md border border-border bg-card p-5">
                  <div className="flex items-center gap-2">
                    <Pill tone="success">
                      <GaugeCircle className="size-3.5" aria-hidden /> Resolved
                    </Pill>
                    <span className="font-mono text-xs text-muted-foreground">{report.id}</span>
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold">{report.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {report.locality}, {report.district} · {report.affectedPeople.toLocaleString("en-IN")} people benefited
                  </p>
                </li>
              ))}
            </ul>
          )}
        </DataState>
      </section>

      {/* Stakeholders */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">One ecosystem, four stakeholders</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAKEHOLDERS.map((s) => (
              <div key={s.title} className="rounded-md border border-border bg-surface p-5">
                <s.icon className="size-5 text-accent" aria-hidden />
                <h3 className="mt-3 font-display text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-md border border-border bg-surface p-8 text-center">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">Transparency by default</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Every priority score, match score and trust score on this platform is shown with the factors
            behind it. Nothing is presented as an unexplained number.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/transparency">
              <Button>Public dashboard</Button>
            </Link>
            <Link to="/engines">
              <Button variant="outline">How the five engines work</Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
