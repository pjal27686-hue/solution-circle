import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { RequireRole, useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/common/StatCard";
import { DataState } from "@/components/common/DataState";
import { ApplicationStatusBadge, Pill } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { applicationService, challengeService, referenceService } from "@/services";

export const Route = createFileRoute("/student/applications")({
  head: () => ({
    meta: [
      { title: "My applications and proposals — CivicBridge" },
      {
        name: "description",
        content: "Every proposal your team submitted, with approach, timeline, budget, deliverables, risks and evaluation status.",
      },
      { property: "og:title", content: "My applications and proposals — CivicBridge" },
      { property: "og:description", content: "Track proposals through evaluation, shortlisting and selection." },
    ],
  }),
  component: () => (
    <RequireRole roles={["student", "university", "organization", "platform_admin", "super_admin"]}>
      <Applications />
    </RequireRole>
  ),
});

function Applications() {
  const { user } = useAuth();
  const teams = useQuery({ queryKey: ["teams"], queryFn: referenceService.teams });
  const challenges = useQuery({ queryKey: ["challenges"], queryFn: () => challengeService.list() });

  const myTeam =
    teams.data?.find(
      (t) =>
        (user?.universityId && t.universityId === user.universityId) ||
        (user?.organizationId && t.organizationId === user.organizationId),
    ) ?? teams.data?.[0];

  const query = useQuery({
    queryKey: ["applications", { teamId: myTeam?.id }],
    queryFn: () => applicationService.list({ teamId: myTeam!.id }),
    enabled: Boolean(myTeam),
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Proposals"
        title="My applications"
        description={myTeam ? `Submitted by ${myTeam.name}.` : "No team linked to your account yet."}
        actions={
          <Link to="/challenges">
            <Button>Find a challenge</Button>
          </Link>
        }
      />

      <div className="mt-6">
        <DataState
          isLoading={query.isLoading || teams.isLoading}
          isError={query.isError}
          error={query.error}
          data={query.data}
          onRetry={() => void query.refetch()}
          loadingLabel="Loading applications…"
          isEmpty={(d) => d.length === 0}
          emptyTitle="No applications submitted"
          emptyDescription="Pick a challenge that matches your team's skills and submit a proposal."
          emptyAction={
            <Link to="/challenges">
              <Button>Browse challenges</Button>
            </Link>
          }
        >
          {(data) => (
            <ul className="space-y-4">
              {data.map((app) => {
                const challenge = challenges.data?.find((c) => c.id === app.challengeId);
                return (
                  <li key={app.id} className="rounded-md border border-border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">{app.id}</p>
                        <h2 className="mt-1 font-display text-base font-semibold">
                          {challenge ? (
                            <Link to="/challenges/$challengeId" params={{ challengeId: challenge.id }} className="hover:text-primary">
                              {challenge.title}
                            </Link>
                          ) : (
                            app.challengeId
                          )}
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Submitted {new Date(app.submittedAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <ApplicationStatusBadge status={app.status} />
                        <Pill>{app.matchScore}% match</Pill>
                      </div>
                    </div>

                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-sm border border-border bg-surface p-3">
                        <dt className="text-xs text-muted-foreground">Approach</dt>
                        <dd className="mt-0.5 text-sm">{app.proposal.approach}</dd>
                      </div>
                      <div className="rounded-sm border border-border bg-surface p-3">
                        <dt className="text-xs text-muted-foreground">Timeline and budget</dt>
                        <dd className="mt-0.5 text-sm">
                          {app.proposal.timelineWeeks} weeks · {app.proposal.budget}
                        </dd>
                      </div>
                      <div className="rounded-sm border border-border bg-surface p-3">
                        <dt className="text-xs text-muted-foreground">Deliverables</dt>
                        <dd className="mt-0.5 text-sm">{app.proposal.deliverables.join(", ")}</dd>
                      </div>
                      <div className="rounded-sm border border-border bg-surface p-3">
                        <dt className="text-xs text-muted-foreground">Risks</dt>
                        <dd className="mt-0.5 text-sm">{app.proposal.risks.join(", ")}</dd>
                      </div>
                    </dl>

                    {app.evaluationNotes && (
                      <p className="mt-3 rounded-sm border border-info/30 bg-info/10 p-3 text-sm">
                        Evaluation note: {app.evaluationNotes}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </DataState>
      </div>
    </AppShell>
  );
}
