import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireRole, useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/common/StatCard";
import { DataState } from "@/components/common/DataState";
import { Pill, ProjectStatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectService } from "@/services";
import type { Evidence, Milestone } from "@/types";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project workspace — CivicBridge" },
      {
        name: "description",
        content:
          "Shared workspace for a civic project: team, officer, milestones, tasks, progress updates, evidence and activity log.",
      },
      { property: "og:title", content: "Project workspace — CivicBridge" },
      { property: "og:description", content: "Milestones, tasks, evidence and activity in one place." },
    ],
  }),
  component: () => (
    <RequireRole
      roles={["student", "university", "organization", "officer", "gov_admin", "platform_admin", "super_admin"]}
    >
      <Workspace />
    </RequireRole>
  ),
});

const EVIDENCE_KINDS: Evidence["kind"][] = ["image", "document", "report", "before_after", "location", "completion"];

function Workspace() {
  const { projectId } = Route.useParams();
  const { actor } = useAuth();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<Evidence["kind"]>("report");

  const query = useQuery({ queryKey: ["project", projectId], queryFn: () => projectService.get(projectId) });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    void queryClient.invalidateQueries({ queryKey: ["projects"] });
    void queryClient.invalidateQueries({ queryKey: ["evidence"] });
    void queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
  };

  const milestone = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Milestone["status"] }) => {
      if (!actor) throw new Error("Not signed in");
      return projectService.setMilestone(projectId, id, status, actor);
    },
    onSuccess: () => {
      toast.success("Milestone updated");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submitForVerification = useMutation({
    mutationFn: () => {
      if (!actor) throw new Error("Not signed in");
      return projectService.update(projectId, { status: "SUBMITTED" }, actor);
    },
    onSuccess: () => {
      toast.success("Submitted for government verification");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addEvidence = useMutation({
    mutationFn: () => {
      if (!actor) throw new Error("Not signed in");
      return projectService.addEvidence(projectId, { label, kind, sizeKb: 820 }, actor);
    },
    onSuccess: () => {
      toast.success("Evidence recorded and queued for officer verification");
      setLabel("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell>
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All projects
      </Link>

      <DataState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data}
        onRetry={() => void query.refetch()}
        loadingLabel="Loading workspace…"
      >
        {({ project, challenge, evidence }) => (
          <div className="mt-4 space-y-8">
            <PageHeader
              eyebrow={project.code}
              title={challenge?.title ?? project.teamName}
              description={challenge?.problemStatement ?? "Allocated civic project workspace."}
              actions={
                <Button
                  disabled={submitForVerification.isPending || !["IN_PROGRESS", "ACCEPTED"].includes(project.status)}
                  onClick={() => submitForVerification.mutate()}
                >
                  {submitForVerification.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  Submit for verification
                </Button>
              }
            />

            <div className="flex flex-wrap gap-2">
              <ProjectStatusBadge status={project.status} />
              <Pill>Team: {project.teamName}</Pill>
              <Pill>Officer: {project.officerName}</Pill>
              <Pill>Started {new Date(project.startedAt).toLocaleDateString("en-IN")}</Pill>
              <Pill>Due {new Date(project.dueAt).toLocaleDateString("en-IN")}</Pill>
              <Pill>{project.progress}% progress</Pill>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              <div className="space-y-6">
                <section className="rounded-md border border-border bg-card p-5">
                  <h2 className="font-display text-base font-semibold">Milestones</h2>
                  <ul className="mt-4 space-y-3">
                    {project.milestones.map((m) => (
                      <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium">{m.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Due {new Date(m.dueAt).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Pill
                            tone={
                              m.status === "verified"
                                ? "success"
                                : m.status === "submitted"
                                  ? "warning"
                                  : m.status === "in_progress"
                                    ? "info"
                                    : "neutral"
                            }
                          >
                            {m.status.replace(/_/g, " ")}
                          </Pill>
                          {m.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => milestone.mutate({ id: m.id, status: "in_progress" })}>
                              Start
                            </Button>
                          )}
                          {m.status === "in_progress" && (
                            <Button size="sm" variant="outline" onClick={() => milestone.mutate({ id: m.id, status: "submitted" })}>
                              Submit
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-md border border-border bg-card p-5">
                  <h2 className="font-display text-base font-semibold">Tasks</h2>
                  <ul className="mt-3 space-y-2 text-sm">
                    {project.tasks.map((task) => (
                      <li key={task.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
                        <span>{task.title}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{task.assigneeName}</span>
                          <Pill tone={task.status === "done" ? "success" : task.status === "doing" ? "info" : "neutral"}>
                            {task.status}
                          </Pill>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-md border border-border bg-card p-5">
                  <h2 className="font-display text-base font-semibold">Activity log</h2>
                  <ol className="mt-3 space-y-3">
                    {project.updates.map((update) => (
                      <li key={update.id} className="border-l-2 border-border pl-3">
                        <p className="text-sm">{update.body}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {update.authorName} · {new Date(update.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-md border border-border bg-card p-5">
                  <h2 className="font-display text-base font-semibold">Add evidence</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    In the deployed build the file uploads to object storage; the record here holds the storage key,
                    owner, project, timestamp and verification state.
                  </p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <Label htmlFor="elabel">Description</Label>
                      <Input
                        id="elabel"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="e.g. Completed drainage stretch, ward 4"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ekind">Evidence type</Label>
                      <Select value={kind} onValueChange={(v) => setKind(v as Evidence["kind"])}>
                        <SelectTrigger id="ekind" className="mt-1.5 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EVIDENCE_KINDS.map((k) => (
                            <SelectItem key={k} value={k}>
                              {k.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="w-full"
                      disabled={!label.trim() || addEvidence.isPending}
                      onClick={() => addEvidence.mutate()}
                    >
                      {addEvidence.isPending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <Upload className="size-4" aria-hidden />
                      )}
                      Record evidence
                    </Button>
                  </div>
                </section>

                <section className="rounded-md border border-border bg-card p-5">
                  <h2 className="font-display text-base font-semibold">Evidence trail</h2>
                  {evidence.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">No evidence recorded yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {evidence.map((item) => (
                        <li key={item.id} className="rounded-sm border border-border bg-surface p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-medium">{item.label}</span>
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
                          </div>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">{item.storageKey}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.kind.replace(/_/g, " ")} · {item.sizeKb} KB · {item.ownerName}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}
      </DataState>
    </AppShell>
  );
}
