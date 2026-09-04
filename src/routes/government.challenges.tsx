import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireRole, useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/common/StatCard";
import { DataState } from "@/components/common/DataState";
import { ApplicationStatusBadge, ChallengeStatusBadge, Pill, PriorityBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { applicationService, challengeService, projectService } from "@/services";
import { NEXT_CHALLENGE_STATES } from "@/types";
import type { ApplicationStatus, Challenge } from "@/types";

export const Route = createFileRoute("/government/challenges")({
  head: () => ({
    meta: [
      { title: "Challenge pipeline and allocation — government" },
      {
        name: "description",
        content:
          "Publish challenges, evaluate proposals, shortlist and select one team, then allocate the project. Invalid state transitions are blocked.",
      },
      { property: "og:title", content: "Challenge pipeline and allocation — CivicBridge" },
      { property: "og:description", content: "Controlled allocation with a backend-enforced state machine." },
    ],
  }),
  component: () => (
    <RequireRole roles={["officer", "gov_admin", "platform_admin", "super_admin"]}>
      <Pipeline />
    </RequireRole>
  ),
});

function Pipeline() {
  const { actor } = useAuth();
  const queryClient = useQueryClient();
  const challenges = useQuery({ queryKey: ["challenges"], queryFn: () => challengeService.list() });
  const applications = useQuery({ queryKey: ["applications", {}], queryFn: () => applicationService.list() });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["challenges"] });
    void queryClient.invalidateQueries({ queryKey: ["applications"] });
    void queryClient.invalidateQueries({ queryKey: ["projects"] });
    void queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
  };

  const advance = useMutation({
    mutationFn: ({ challenge, status }: { challenge: Challenge; status: Challenge["status"] }) => {
      if (!actor) throw new Error("Not signed in");
      return challengeService.setStatus(challenge.id, status, actor);
    },
    onSuccess: (challenge) => {
      toast.success(`${challenge.code} → ${challenge.status.replace(/_/g, " ")}`);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) => {
      if (!actor) throw new Error("Not signed in");
      return applicationService.setStatus(id, status, actor);
    },
    onSuccess: (app) => {
      toast.success(`Application ${app.id} → ${app.status.replace(/_/g, " ")}`);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const allocate = useMutation({
    mutationFn: (applicationId: string) => {
      if (!actor) throw new Error("Not signed in");
      return projectService.allocate(applicationId, actor);
    },
    onSuccess: (project) => {
      toast.success(`Project ${project.id} created and allocated`);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Allocation"
        title="Challenge pipeline"
        description="A challenge cannot be claimed freely. It moves through publication, applications, evaluation, shortlisting, selection and allocation — each transition validated server side."
      />

      <div className="mt-6">
        <DataState
          isLoading={challenges.isLoading}
          isError={challenges.isError}
          error={challenges.error}
          data={challenges.data}
          onRetry={() => void challenges.refetch()}
          loadingLabel="Loading challenges…"
          isEmpty={(d) => d.length === 0}
          emptyTitle="No challenges yet"
          emptyDescription="Convert a verified cluster into a challenge to start the pipeline."
          emptyAction={
            <Link to="/government/clusters">
              <Button>Go to clusters</Button>
            </Link>
          }
        >
          {(data) => (
            <ul className="space-y-4">
              {data.map((challenge) => {
                const apps = (applications.data ?? []).filter((a) => a.challengeId === challenge.id);
                const next = NEXT_CHALLENGE_STATES[challenge.status] ?? [];
                return (
                  <li key={challenge.id} className="rounded-md border border-border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">{challenge.code}</p>
                        <h2 className="mt-1 font-display text-lg font-semibold">
                          <Link
                            to="/challenges/$challengeId"
                            params={{ challengeId: challenge.id }}
                            className="hover:text-primary"
                          >
                            {challenge.title}
                          </Link>
                        </h2>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <ChallengeStatusBadge status={challenge.status} />
                          <PriorityBadge score={challenge.priorityScore} />
                          <Pill>{challenge.district}</Pill>
                          <Pill>{apps.length} applications</Pill>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {next.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Terminal state</span>
                        ) : (
                          next.map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant={status === "CANCELLED" || status === "REJECTED" ? "destructive" : "outline"}
                              disabled={advance.isPending}
                              onClick={() => advance.mutate({ challenge, status })}
                            >
                              {advance.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                              {status.replace(/_/g, " ")}
                            </Button>
                          ))
                        )}
                      </div>
                    </div>

                    {apps.length > 0 && (
                      <div className="mt-5 overflow-x-auto rounded-sm border border-border">
                        <table className="w-full min-w-[720px] text-sm">
                          <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Team</th>
                              <th className="px-3 py-2 font-semibold">Match</th>
                              <th className="px-3 py-2 font-semibold">Timeline</th>
                              <th className="px-3 py-2 font-semibold">Status</th>
                              <th className="px-3 py-2 font-semibold">Decision</th>
                            </tr>
                          </thead>
                          <tbody>
                            {apps.map((app) => (
                              <tr key={app.id} className="border-t border-border">
                                <td className="px-3 py-2">
                                  <p className="font-medium">{app.teamName}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">{app.proposal.approach}</p>
                                </td>
                                <td className="px-3 py-2 tabular-nums">{app.matchScore}%</td>
                                <td className="px-3 py-2 tabular-nums">{app.proposal.timelineWeeks}w</td>
                                <td className="px-3 py-2">
                                  <ApplicationStatusBadge status={app.status} />
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex flex-wrap gap-1.5">
                                    {app.status === "submitted" && (
                                      <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: app.id, status: "under_evaluation" })}>
                                        Evaluate
                                      </Button>
                                    )}
                                    {app.status === "under_evaluation" && (
                                      <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: app.id, status: "shortlisted" })}>
                                        Shortlist
                                      </Button>
                                    )}
                                    {app.status === "shortlisted" && (
                                      <Button size="sm" onClick={() => decide.mutate({ id: app.id, status: "selected" })}>
                                        Select
                                      </Button>
                                    )}
                                    {app.status === "selected" && (
                                      <Button size="sm" disabled={allocate.isPending} onClick={() => allocate.mutate(app.id)}>
                                        Allocate project
                                      </Button>
                                    )}
                                    {!["rejected", "allocated"].includes(app.status) && (
                                      <Button size="sm" variant="ghost" onClick={() => decide.mutate({ id: app.id, status: "rejected" })}>
                                        Reject
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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
