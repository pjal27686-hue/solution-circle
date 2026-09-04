import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, ShieldCheck, Users, Award } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireRole, useAuth } from "@/hooks/useAuth";
import { PageHeader, StatCard } from "@/components/common/StatCard";
import { DataState } from "@/components/common/DataState";
import { ApplicationStatusBadge, Pill, ProjectStatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { applicationService, projectService, referenceService } from "@/services";

export const Route = createFileRoute("/university")({
  head: () => ({
    meta: [
      { title: "University coordinator dashboard — CivicBridge" },
      {
        name: "description",
        content:
          "Coordinate student teams, verify participants, monitor applications and projects, and see your institution's civic impact.",
      },
      { property: "og:title", content: "University coordinator dashboard — CivicBridge" },
      { property: "og:description", content: "Teams, skills, participation and project performance in one view." },
    ],
  }),
  component: () => (
    <RequireRole roles={["university", "platform_admin", "super_admin"]}>
      <UniversityDashboard />
    </RequireRole>
  ),
});

function UniversityDashboard() {
  const { user } = useAuth();
  const universities = useQuery({ queryKey: ["universities"], queryFn: referenceService.universities });
  const teams = useQuery({ queryKey: ["teams"], queryFn: referenceService.teams });
  const users = useQuery({ queryKey: ["users"], queryFn: referenceService.users });
  const applications = useQuery({ queryKey: ["applications", {}], queryFn: () => applicationService.list() });
  const projects = useQuery({ queryKey: ["projects", {}], queryFn: () => projectService.list() });

  const university = universities.data?.find((u) => u.id === user?.universityId) ?? universities.data?.[0];
  const myTeams = (teams.data ?? []).filter((t) => t.universityId === university?.id);
  const teamIds = myTeams.map((t) => t.id);
  const myStudents = (users.data ?? []).filter((u) => u.role === "student" && u.universityId === university?.id);
  const myApplications = (applications.data ?? []).filter((a) => teamIds.includes(a.teamId));
  const myProjects = (projects.data ?? []).filter((p) => teamIds.includes(p.teamId));

  return (
    <AppShell>
      <PageHeader
        eyebrow="University"
        title={university?.name ?? "University coordination"}
        description="Team formation, student verification and project oversight for your institution. Verification of a student is recorded and visible to government officers."
        actions={
          <Link to="/challenges">
            <Button>Browse challenges</Button>
          </Link>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students registered" value={myStudents.length} icon={GraduationCap} />
        <StatCard label="Teams" value={myTeams.length} icon={Users} />
        <StatCard label="Applications" value={myApplications.length} icon={ShieldCheck} />
        <StatCard label="Projects" value={myProjects.length} icon={Award} />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Teams and capability</h2>
        <DataState
          isLoading={teams.isLoading}
          isError={teams.isError}
          error={teams.error}
          data={myTeams}
          onRetry={() => void teams.refetch()}
          loadingLabel="Loading teams…"
          isEmpty={(d) => d.length === 0}
          emptyTitle="No teams yet"
          emptyDescription="Teams grouped under your institution will appear here."
        >
          {(data) => (
            <ul className="mt-4 grid gap-4 lg:grid-cols-2">
              {data.map((team) => (
                <li key={team.id} className="rounded-md border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-base font-semibold">{team.name}</h3>
                    <Pill tone={team.verified ? "success" : "warning"}>
                      {team.verified ? "verified" : "pending verification"}
                    </Pill>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{team.memberNames.join(", ")}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {team.skills.map((skill) => (
                      <Pill key={skill} tone="primary">
                        {skill}
                      </Pill>
                    ))}
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Capacity</dt>
                      <dd className="font-medium tabular-nums">{team.capacity} projects</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Completed</dt>
                      <dd className="font-medium tabular-nums">{team.completedProjects}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">On time</dt>
                      <dd className="font-medium tabular-nums">{Math.round(team.onTimeRate * 100)}%</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Trust score {team.trustScore} — derived from verification, completed projects, deadline
                    performance and government-verified evidence. It cannot be edited by users.
                  </p>
                </li>
              ))}
            </ul>
          )}
        </DataState>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-lg font-semibold">Students</h2>
          <DataState
            isLoading={users.isLoading}
            isError={users.isError}
            error={users.error}
            data={myStudents}
            onRetry={() => void users.refetch()}
            loadingLabel="Loading students…"
            isEmpty={(d) => d.length === 0}
            emptyTitle="No students registered"
            skeletonRows={3}
          >
            {(data) => (
              <ul className="mt-4 space-y-2">
                {data.map((student) => (
                  <li key={student.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card p-4">
                    <div>
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {typeof student.trustScore === "number" && <Pill>Trust {student.trustScore}</Pill>}
                      <Pill tone={student.verified ? "success" : "warning"}>
                        {student.verified ? "verified" : "unverified"}
                      </Pill>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DataState>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold">Participation</h2>
          <div className="mt-4 space-y-2">
            {myApplications.map((app) => (
              <div key={app.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card p-4">
                <div>
                  <p className="text-sm font-medium">{app.teamName}</p>
                  <p className="text-xs text-muted-foreground">{app.id}</p>
                </div>
                <ApplicationStatusBadge status={app.status} />
              </div>
            ))}
            {myProjects.map((project) => (
              <div key={project.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card p-4">
                <div>
                  <Link to="/projects/$projectId" params={{ projectId: project.id }} className="text-sm font-medium hover:text-primary">
                    {project.code}
                  </Link>
                  <p className="text-xs text-muted-foreground">{project.teamName}</p>
                </div>
                <ProjectStatusBadge status={project.status} />
              </div>
            ))}
            {myApplications.length === 0 && myProjects.length === 0 && (
              <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No applications or projects yet for your teams.
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
