import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { DataState } from "@/components/common/DataState";
import { ApplicationStatusBadge, ChallengeStatusBadge, Pill, PriorityBadge } from "@/components/common/StatusBadge";
import { FactorBar, PageHeader } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CHALLENGE_FLOW } from "@/types";
import { applicationService, challengeService, matchService, referenceService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/challenges/$challengeId")({
  head: () => ({
    meta: [
      { title: "Challenge details — CivicBridge" },
      {
        name: "description",
        content:
          "Full challenge brief: problem statement, constraints, required skills, evaluation criteria, evidence requirements and recommended teams.",
      },
      { property: "og:title", content: "Challenge details — CivicBridge" },
      { property: "og:description", content: "Official civic challenge brief and matched teams." },
    ],
  }),
  component: ChallengeDetail,
});

function ChallengeDetail() {
  const { challengeId } = Route.useParams();
  const { user, actor } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [approach, setApproach] = useState("");
  const [weeks, setWeeks] = useState("10");
  const [budget, setBudget] = useState("");

  const challenge = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () => challengeService.get(challengeId),
  });
  const matches = useQuery({
    queryKey: ["matches", { challengeId }],
    queryFn: () => matchService.forChallenge(challengeId),
  });
  const applications = useQuery({
    queryKey: ["applications", { challengeId }],
    queryFn: () => applicationService.list({ challengeId }),
  });
  const teams = useQuery({ queryKey: ["teams"], queryFn: referenceService.teams });

  const myTeam = teams.data?.find(
    (t) =>
      (user?.universityId && t.universityId === user.universityId) ||
      (user?.organizationId && t.organizationId === user.organizationId),
  );

  const apply = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Sign in to apply");
      if (!myTeam) throw new Error("No team linked to your account");
      return challengeService.apply(
        challengeId,
        {
          teamId: myTeam.id,
          proposal: {
            approach,
            timelineWeeks: Number(weeks),
            budget,
            deliverables: ["Approach document", "Field validation", "Final handover"],
            risks: ["Timeline risk during monsoon"],
          },
        },
        actor,
      );
    },
    onSuccess: () => {
      toast.success("Proposal submitted for evaluation");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      void queryClient.invalidateQueries({ queryKey: ["challenge", challengeId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canApply = user && ["student", "university", "organization"].includes(user.role);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link to="/challenges" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> All challenges
        </Link>

        <DataState
          isLoading={challenge.isLoading}
          isError={challenge.isError}
          error={challenge.error}
          data={challenge.data}
          onRetry={() => void challenge.refetch()}
          loadingLabel="Loading challenge brief…"
        >
          {(data) => (
            <div className="mt-4 space-y-8">
              <PageHeader
                eyebrow={data.code}
                title={data.title}
                description={data.problemStatement}
                actions={
                  canApply ? (
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button disabled={!["PUBLISHED", "APPLICATION_OPEN"].includes(data.status)}>
                          {["PUBLISHED", "APPLICATION_OPEN"].includes(data.status)
                            ? "Apply with proposal"
                            : "Applications closed"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Submit a proposal</DialogTitle>
                          <DialogDescription>
                            Applying as {myTeam?.name ?? "no linked team"}. The backend validates eligibility,
                            duplicate applications and the challenge state before accepting.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="approach">Approach</Label>
                            <Textarea
                              id="approach"
                              rows={4}
                              value={approach}
                              onChange={(e) => setApproach(e.target.value)}
                              className="mt-1.5"
                              placeholder="How will your team solve this problem?"
                            />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <Label htmlFor="weeks">Timeline (weeks)</Label>
                              <Input id="weeks" type="number" min={1} value={weeks} onChange={(e) => setWeeks(e.target.value)} className="mt-1.5" />
                            </div>
                            <div>
                              <Label htmlFor="budget">Budget estimate</Label>
                              <Input id="budget" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="INR 6 lakh" className="mt-1.5" />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => apply.mutate()}
                            disabled={apply.isPending || !approach.trim() || !myTeam}
                          >
                            {apply.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />} Submit proposal
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button variant="outline" onClick={() => void navigate({ to: "/auth" })}>
                      Sign in to apply
                    </Button>
                  )
                }
              />

              <div className="flex flex-wrap gap-2">
                <ChallengeStatusBadge status={data.status} />
                <PriorityBadge score={data.priorityScore} />
                <Pill>{data.category}</Pill>
                <Pill>
                  {data.district}, {data.state}
                </Pill>
                <Pill>{data.affectedPeople.toLocaleString("en-IN")} people affected</Pill>
                <Pill>{data.timelineWeeks} weeks</Pill>
                <Pill>{data.budget}</Pill>
              </div>

              {/* Lifecycle */}
              <section className="rounded-md border border-border bg-card p-5">
                <h2 className="font-display text-lg font-semibold">Lifecycle state</h2>
                <ol className="mt-4 flex flex-wrap gap-1.5">
                  {CHALLENGE_FLOW.map((step) => {
                    const currentIndex = CHALLENGE_FLOW.indexOf(data.status);
                    const stepIndex = CHALLENGE_FLOW.indexOf(step);
                    const done = currentIndex >= 0 && stepIndex < currentIndex;
                    const active = step === data.status;
                    return (
                      <li
                        key={step}
                        className={cn(
                          "rounded-sm border px-2 py-1 text-[11px] font-medium tracking-wide",
                          active && "border-primary bg-primary/15 text-primary",
                          done && "border-success/30 bg-success/10 text-success",
                          !done && !active && "border-border bg-muted text-muted-foreground",
                        )}
                      >
                        {step.replace(/_/g, " ")}
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-3 text-xs text-muted-foreground">
                  Invalid transitions are rejected by the backend state machine, not hidden in the interface.
                </p>
              </section>

              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div className="space-y-6">
                  <Section title="Background">{data.background}</Section>
                  <Section title="Expected solution">{data.expectedSolution}</Section>
                  <ListSection title="Constraints" items={data.constraints} />
                  <ListSection title="Success metrics" items={data.successMetrics} />
                  <ListSection title="Evaluation criteria" items={data.evaluationCriteria} />
                  <ListSection title="Evidence requirements" items={data.evidenceRequirements} />
                </div>

                <div className="space-y-6">
                  <section className="rounded-md border border-border bg-card p-5">
                    <h2 className="font-display text-base font-semibold">Required skills</h2>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {data.requiredSkills.map((skill) => (
                        <Pill key={skill} tone="primary">
                          {skill}
                        </Pill>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-md border border-border bg-card p-5">
                    <h2 className="font-display text-base font-semibold">Recommended teams</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Capability match, computed from declared skills and past performance.
                    </p>
                    <DataState
                      isLoading={matches.isLoading}
                      isError={matches.isError}
                      error={matches.error}
                      data={matches.data}
                      isEmpty={(d) => d.length === 0}
                      onRetry={() => void matches.refetch()}
                      loadingLabel="Computing matches…"
                      emptyTitle="No teams available"
                      skeletonRows={2}
                    >
                      {(list) => (
                        <ul className="mt-4 space-y-4">
                          {list.slice(0, 3).map((match) => (
                            <li key={match.teamId} className="border-b border-border pb-4 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold">{match.teamName}</p>
                                <Pill tone={match.score >= 75 ? "success" : match.score >= 55 ? "info" : "neutral"}>
                                  {match.score}% match
                                </Pill>
                              </div>
                              <div className="mt-3 space-y-2.5">
                                {match.factors.slice(0, 3).map((f) => (
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
                          ))}
                        </ul>
                      )}
                    </DataState>
                  </section>

                  <section className="rounded-md border border-border bg-card p-5">
                    <h2 className="font-display text-base font-semibold">Applications received</h2>
                    <DataState
                      isLoading={applications.isLoading}
                      isError={applications.isError}
                      error={applications.error}
                      data={applications.data}
                      isEmpty={(d) => d.length === 0}
                      onRetry={() => void applications.refetch()}
                      loadingLabel="Loading applications…"
                      emptyTitle="No applications yet"
                      emptyDescription="Teams that apply will appear here with their match score."
                      skeletonRows={2}
                    >
                      {(list) => (
                        <ul className="mt-3 space-y-2">
                          {list.map((app) => (
                            <li key={app.id} className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border bg-surface p-3">
                              <span className="text-sm font-medium">{app.teamName}</span>
                              <span className="flex items-center gap-2">
                                <Pill>{app.matchScore}% match</Pill>
                                <ApplicationStatusBadge status={app.status} />
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </DataState>
                  </section>
                </div>
              </div>
            </div>
          )}
        </DataState>
      </div>
    </PublicLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </section>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
