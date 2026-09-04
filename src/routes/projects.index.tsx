import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { RequireRole } from "@/hooks/useAuth";
import { PageHeader } from "@/components/common/StatCard";
import { DataState } from "@/components/common/DataState";
import { Pill, ProjectStatusBadge } from "@/components/common/StatusBadge";
import { projectService } from "@/services";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Civic projects in execution — CivicBridge" },
      {
        name: "description",
        content: "All allocated civic projects with team, officer, progress, milestones and verification state.",
      },
      { property: "og:title", content: "Civic projects in execution — CivicBridge" },
      { property: "og:description", content: "Track allocated civic projects end to end." },
    ],
  }),
  component: () => (
    <RequireRole
      roles={["student", "university", "organization", "officer", "gov_admin", "platform_admin", "super_admin"]}
    >
      <Projects />
    </RequireRole>
  ),
});

function Projects() {
  const query = useQuery({ queryKey: ["projects", {}], queryFn: () => projectService.list() });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Execution"
        title="Civic projects"
        description="Each project has one selected team, a government officer, a milestone plan and an evidence trail."
      />

      <div className="mt-6">
        <DataState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          data={query.data}
          onRetry={() => void query.refetch()}
          loadingLabel="Loading projects…"
          isEmpty={(d) => d.length === 0}
          emptyTitle="No projects allocated yet"
          emptyDescription="Projects are created when a government officer allocates a selected proposal."
        >
          {(data) => (
            <ul className="grid gap-4 lg:grid-cols-2">
              {data.map((project) => (
                <li key={project.id}>
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: project.id }}
                    className="group block rounded-md border border-border bg-card p-5 transition-colors hover:border-primary/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{project.code}</span>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    <h2 className="mt-2 font-display text-lg font-semibold group-hover:text-primary">
                      {project.teamName}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">Officer: {project.officerName}</p>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span className="tabular-nums">{project.progress}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <Pill>{project.milestones.length} milestones</Pill>
                      <Pill>{project.tasks.length} tasks</Pill>
                      <Pill>Due {new Date(project.dueAt).toLocaleDateString("en-IN")}</Pill>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DataState>
      </div>
    </AppShell>
  );
}
