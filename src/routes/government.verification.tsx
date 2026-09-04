import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, FileCheck2, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireRole, useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/common/StatCard";
import { DataState } from "@/components/common/DataState";
import { Pill, ProjectStatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { evidenceService, projectService } from "@/services";
import type { Evidence } from "@/types";

export const Route = createFileRoute("/government/verification")({
  head: () => ({
    meta: [
      { title: "Evidence and completion verification — government" },
      {
        name: "description",
        content:
          "Review submitted project evidence, verify or reject it, and confirm completion so a problem can be marked resolved.",
      },
      { property: "og:title", content: "Evidence and completion verification — CivicBridge" },
      { property: "og:description", content: "Only verified completion closes the civic loop." },
    ],
  }),
  component: () => (
    <RequireRole roles={["officer", "gov_admin", "platform_admin", "super_admin"]}>
      <Verification />
    </RequireRole>
  ),
});

function Verification() {
  const { actor } = useAuth();
  const queryClient = useQueryClient();
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: evidenceService.list });
  const projects = useQuery({ queryKey: ["projects", {}], queryFn: () => projectService.list() });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["evidence"] });
    void queryClient.invalidateQueries({ queryKey: ["projects"] });
    void queryClient.invalidateQueries({ queryKey: ["problems"] });
    void queryClient.invalidateQueries({ queryKey: ["impact"] });
    void queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
  };

  const verify = useMutation({
    mutationFn: ({ id, state }: { id: string; state: Evidence["verificationState"] }) => {
      if (!actor) throw new Error("Not signed in");
      return evidenceService.verify(id, state, actor);
    },
    onSuccess: (item) => {
      toast.success(`Evidence ${item.id} marked ${item.verificationState}`);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const complete = useMutation({
    mutationFn: (projectId: string) => {
      if (!actor) throw new Error("Not signed in");
      return projectService.update(projectId, { status: "COMPLETED", progress: 100 }, actor);
    },
    onSuccess: (project) => {
      toast.success(`Project ${project.id} verified complete — the linked problem is now resolved`);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const awaiting = (projects.data ?? []).filter((p) => ["SUBMITTED", "VERIFICATION"].includes(p.status));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Verification"
        title="Evidence and completion"
        description="Files live in object storage; the database holds metadata, owner, project, timestamp and verification state. Nothing is auto-approved."
      />

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold">Projects awaiting completion verification</h2>
        <DataState
          isLoading={projects.isLoading}
          isError={projects.isError}
          error={projects.error}
          data={awaiting}
          onRetry={() => void projects.refetch()}
          loadingLabel="Loading projects…"
          isEmpty={(d) => d.length === 0}
          emptyTitle="Nothing awaiting verification"
          emptyDescription="Projects appear here once a team submits final evidence."
        >
          {(data) => (
            <ul className="mt-4 space-y-3">
              {data.map((project) => (
                <li key={project.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-4">
                  <div>
                    <Link to="/projects/$projectId" params={{ projectId: project.id }} className="font-medium hover:text-primary">
                      {project.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {project.id} · {project.teamName} · {project.progress}% reported progress
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProjectStatusBadge status={project.status} />
                    <Button size="sm" disabled={complete.isPending} onClick={() => complete.mutate(project.id)}>
                      <FileCheck2 className="size-4" aria-hidden /> Verify completion
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DataState>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold">Evidence register</h2>
        <DataState
          isLoading={evidence.isLoading}
          isError={evidence.isError}
          error={evidence.error}
          data={evidence.data}
          onRetry={() => void evidence.refetch()}
          loadingLabel="Loading evidence…"
          isEmpty={(d) => d.length === 0}
          emptyTitle="No evidence submitted yet"
          emptyDescription="Teams upload progress and completion proof from their project workspace."
        >
          {(data) => (
            <div className="mt-4 overflow-x-auto rounded-md border border-border bg-card">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="border-b border-border bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Evidence</th>
                    <th className="px-4 py-3 font-semibold">Kind</th>
                    <th className="px-4 py-3 font-semibold">Storage key</th>
                    <th className="px-4 py-3 font-semibold">Uploaded by</th>
                    <th className="px-4 py-3 font-semibold">State</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.projectId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Pill>{item.kind.replace(/_/g, " ")}</Pill>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.storageKey}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.uploadedByName}</td>
                      <td className="px-4 py-3">
                        <Pill
                          tone={
                            item.verificationState === "verified"
                              ? "success"
                              : item.verificationState === "rejected"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {item.verificationState}
                        </Pill>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={verify.isPending || item.verificationState === "verified"}
                            onClick={() => verify.mutate({ id: item.id, state: "verified" })}
                          >
                            <BadgeCheck className="size-4" aria-hidden /> Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={verify.isPending || item.verificationState === "rejected"}
                            onClick={() => verify.mutate({ id: item.id, state: "rejected" })}
                          >
                            <X className="size-4" aria-hidden /> Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataState>
      </section>
    </AppShell>
  );
}
