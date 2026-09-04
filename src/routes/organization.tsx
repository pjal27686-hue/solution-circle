import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, HandHeart, Target, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireRole, useAuth } from "@/hooks/useAuth";
import { FactorBar, PageHeader, StatCard } from "@/components/common/StatCard";
import { DataState } from "@/components/common/DataState";
import { ChallengeStatusBadge, Pill, ProjectStatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { challengeService, matchService, projectService, referenceService } from "@/services";

export const Route = createFileRoute("/organization")({
  head: () => ({
    meta: [
      { title: "Industry and NGO dashboard — CivicBridge" },
      {
        name: "description",
        content:
          "Organisation profile, matched civic challenges, mentoring commitments, partnered student teams and delivered impact.",
      },
      { property: "og:title", content: "Industry and NGO dashboard — CivicBridge" },
      { property: "og:description", content: "Partner with student teams on verified civic challenges." },
    ],
  }),
  component: () => (
    <RequireRole roles={["organization", "platform_admin", "super_admin"]}>
      <OrganizationDashboard />
    </RequireRole>
  ),
});

function OrganizationDashboard() {
  const { user } = useAuth();
  const organizations = useQuery({ queryKey: ["organizations"], queryFn: referenceService.organizations });
  const teams = useQuery({ queryKey: ["teams"], queryFn: referenceService.teams });
  const challenges = useQuery({ queryKey: ["challenges"], queryFn: () => challengeService.list() });
  const projects = useQuery({ queryKey: ["projects", {}], queryFn: () => projectService.list() });

  const org = organizations.data?.find((o) => o.id === user?.organizationId) ?? organizations.data?.[0];
  const myTeam = teams.data?.find((t) => t.organizationId === org?.id);
  const matches = useQuery({
    queryKey: ["matches", { teamId: myTeam?.id }],
    queryFn: () => matchService.forTeam(myTeam!.id),
    enabled: Boolean(myTeam),
  });
  const mentored = (projects.data ?? []).filter((p) => p.mentorOrganizationId === org?.id);

  return (
    <AppShell>
      <PageHeader
        eyebrow={org?.type === "ngo" ? "NGO partner" : "Industry partner"}
        title={org?.name ?? "Organisation dashboard"}
        description="Recommend solutions, partner with student teams, mentor projects and offer technical support on verified civic challenges."
        actions={
          <Link to="/challenges">
            <Button>Browse challenges</Button>
          </Link>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sector" value={org?.sector ?? "—"} icon={Briefcase} />
        <StatCard label="Team size" value={org?.teamSize ?? "—"} icon={Users} />
        <StatCard label="Past projects" value={org?.pastProjects ?? "—"} icon={Target} />
        <StatCard label="Projects mentored" value={mentored.length} icon={HandHeart} />
      </div>

      {org && (
        <section className="mt-8 rounded-md border border-border bg-card p-5">
          <h2 className="font-display text-base font-semibold">Capability profile</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {org.skills.map((skill) => (
              <Pill key={skill} tone="primary">
                {skill}
              </Pill>
            ))}
            {org.domains.map((domain) => (
              <Pill key={domain}>{domain}</Pill>
            ))}
            <Pill tone={org.verified ? "success" : "warning"}>{org.verified ? "verified" : "pending verification"}</Pill>
            <Pill>
              {org.district}, {org.state}
            </Pill>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Trust score {org.trustScore} — from verified identity, completed projects, government-verified evidence
            and deadline performance. Organisations cannot edit this value.
          </p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Matched challenges</h2>
        <DataState
          isLoading={matches.isLoading || challenges.isLoading}
          isError={matches.isError}
          error={matches.error}
          data={matches.data}
          onRetry={() => void matches.refetch()}
          loadingLabel="Computing matches…"
          isEmpty={(d) => d.length === 0}
          emptyTitle="No matched challenges"
          emptyDescription="Matches appear once challenges are published in your domains."
        >
          {(data) => (
            <ul className="mt-4 grid gap-4 lg:grid-cols-2">
              {data.slice(0, 4).map((match) => {
                const challenge = challenges.data?.find((c) => c.id === match.challengeId);
                return (
                  <li key={match.challengeId} className="rounded-md border border-border bg-card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{challenge?.code}</span>
                      <span className="flex items-center gap-2">
                        {challenge && <ChallengeStatusBadge status={challenge.status} />}
                        <Pill tone={match.score >= 75 ? "success" : "info"}>{match.score}% match</Pill>
                      </span>
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
                      {match.factors.slice(0, 4).map((f) => (
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

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Projects you mentor</h2>
        {mentored.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            You are not mentoring any project yet. Mentors are attached when a project is allocated.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {mentored.map((project) => (
              <li key={project.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card p-4">
                <div>
                  <Link to="/projects/$projectId" params={{ projectId: project.id }} className="text-sm font-medium hover:text-primary">
                    {project.code}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {project.teamName} · {project.progress}% progress
                  </p>
                </div>
                <ProjectStatusBadge status={project.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
