import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, ClipboardList, FolderKanban, Target } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireRole, useAuth } from "@/hooks/useAuth";
import { FactorBar, PageHeader, StatCard } from "@/components/common/StatCard";
import { DataState } from "@/components/common/DataState";
import { ApplicationStatusBadge, Pill, ProjectStatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { applicationService, challengeService, matchService, projectService, referenceService } from "@/services";

export const Route = createFileRoute("/student/")({
  head: () => ({
    meta: [
      { title: "Student dashboard — recommended civic challenges" },
      {
        name: "description",
        content:
          "Recommended civic challenges with explained match scores, your applications, active projects and delivered impact.",
      },
      { property: "og:title", content: "Student dashboard — CivicBridge" },
      { property: "og:description", content: "Find civic challenges that match your team's real capability." },
    ],
  }),
  component: () => (
    <RequireRole roles={["student", "university", "platform_admin", "super_admin"]}>
      <StudentDashboard />
    </RequireRole>
  ),
});

function StudentDashboard() {
  const { user } = useAuth();
  const teams = useQuery({ queryKey: ["teams"], queryFn: referenceService.teams });
  const challenges = useQuery({ queryKey: ["challenges"], queryFn: () => challengeService.list() });

  const myTeam = teams.data?.find((t) => t.universityId && t.universityId === user?.universityId) ?? teams.data?.[0];

  const matches = useQuery({
    queryKey: ["matches", { teamId: myTeam?.id }],
    queryFn: () => matchService.forTeam(myTeam!.id),
    enabled: Boolean(myTeam),
  });
  const applications = useQuery({
    queryKey: ["applications", { teamId: myTeam?.id }],
    queryFn: () => applicationService.list({ teamId: myTeam!.id }),
    enabled: Boolean(myTeam),
  });
  const projects = useQuery({
    queryKey: ["projects", { teamId: myTeam?.id }],
    queryFn: () => projectService.list({ teamId: myTeam!.id }),
    enabled: Boolean(myTeam),
  });

  const active = (projects.data ?? []).filter((p) => p.status !== "COMPLETED");
  const completed = (projects.data ?? []).filter((p) => p.status === "COMPLETED");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Student portal"
        title={`Welcome, ${user?.name ?? "student"}`}
        description={
          myTeam
            ? `Acting as ${myTeam.name}. Match scores below are computed from your declared skills, domain, location, capacity and past performance.`
            : "No team is linked to your account yet — ask your university coordinator to add you to a team."
        }
        actions={
          <Link to="/challenges">
            <Button>Browse all challenges</Button>
          </Link>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open challenges" value={challenges.data?.length ?? "—"} icon={Target} />
        <StatCard label="My applications" value={applications.data?.length ?? "—"} icon={ClipboardList} />
        <StatCard label="Active projects" value={active.length} icon={FolderKanban} />
        <StatCard label="Completed projects" value={completed.length} icon={Award} />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Recommended for your team</h2>
        <DataState
          isLoading={matches.isLoading}
          isError={matches.isError}
          error={matches.error}
          data={matches.data}
          onRetry={() => void matches.refetch()}
          loadingLabel="Computing match scores…"
          isEmpty={(d) => d.length === 0}
          emptyTitle="No recommendations yet"
          emptyDescription="Recommendations appear once challenges are published."
        >
          {(data) => (
            <ul className="mt-4 grid gap-4 lg:grid-cols-2">
              {data.slice(0, 4).map((match) => {
                const challenge = challenges.data?.find((c) => c.id === match.challengeId);
                return (
                  <li key={`${match.challengeId}-${match.teamId}`} className="rounded-md border border-border bg-card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{challenge?.code ?? match.challengeId}</span>
                      <Pill tone={match.score >= 75 ? "success" : match.score >= 55 ? "info" : "neutral"}>
                        {match.score}% match
                      </Pill>
                    </div>
                    <h3 className="mt-2 font-display text-base font-semibold">
                      {challenge ? (
                        <Link to="/challenges/$challengeId" params={{ challengeId: challenge.id }} className="hover:text-primary">
                          {challenge.title}
                        </Link>
                      ) : (
                        match.challengeId
                      )}
                    </h3>
                    <div className="mt-4 space-y-2.5">
                      {match.factors.map((f) => (
                        <FactorBar
                          key={f.label}
                          label={f.label}
                          detail={f.detail}
                          valuePct={f.score * 100}
                          weightPct={f.weight * 100}
                        />
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DataState>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">My applications</h2>
            <Link to="/student/applications" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <DataState
            isLoading={applications.isLoading}
            isError={applications.isError}
            error={applications.error}
            data={applications.data}
            onRetry={() => void applications.refetch()}
            loadingLabel="Loading applications…"
            isEmpty={(d) => d.length === 0}
            emptyTitle="No applications yet"
            emptyDescription="Apply to a challenge to start the evaluation process."
            skeletonRows={2}
          >
            {(data) => (
              <ul className="mt-4 space-y-2">
                {data.slice(0, 4).map((app) => (
                  <li key={app.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card p-4">
                    <div>
                      <p className="text-sm font-medium">{app.challengeTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.id} · {app.matchScore}% match
                      </p>
                    </div>
                    <ApplicationStatusBadge status={app.status} />
                  </li>
                ))}
              </ul>
            )}
          </DataState>
        </section>

        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Active projects</h2>
            <Link to="/projects" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <DataState
            isLoading={projects.isLoading}
            isError={projects.isError}
            error={projects.error}
            data={active}
            onRetry={() => void projects.refetch()}
            loadingLabel="Loading projects…"
            isEmpty={(d) => d.length === 0}
            emptyTitle="No active projects"
            emptyDescription="A project workspace opens once your proposal is selected and allocated."
            skeletonRows={2}
          >
            {(data) => (
              <ul className="mt-4 space-y-2">
                {data.map((project) => (
                  <li key={project.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card p-4">
                    <div>
                      <Link to="/projects/$projectId" params={{ projectId: project.id }} className="text-sm font-medium hover:text-primary">
                        {project.code}
                      </Link>
                      <p className="text-xs text-muted-foreground">{project.progress}% progress</p>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </li>
                ))}
              </ul>
            )}
          </DataState>
        </section>
      </div>
    </AppShell>
  );
}
