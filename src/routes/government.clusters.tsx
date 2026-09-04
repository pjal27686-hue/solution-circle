import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireRole, useAuth } from "@/hooks/useAuth";
import { FactorBar, PageHeader } from "@/components/common/StatCard";
import { DataState } from "@/components/common/DataState";
import { Pill, PriorityBadge } from "@/components/common/StatusBadge";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { challengeService, clusterService, referenceService } from "@/services";
import type { ProblemCluster } from "@/types";

export const Route = createFileRoute("/government/clusters")({
  head: () => ({
    meta: [
      { title: "Problem clusters and priority — government" },
      {
        name: "description",
        content:
          "Related citizen reports grouped into problem clusters with an explainable priority score, ready to convert into official challenges.",
      },
      { property: "og:title", content: "Problem clusters and priority — CivicBridge" },
      { property: "og:description", content: "Explainable cluster prioritisation and challenge conversion." },
    ],
  }),
  component: () => (
    <RequireRole roles={["officer", "gov_admin", "platform_admin", "super_admin"]}>
      <Clusters />
    </RequireRole>
  ),
});

const TREND_ICON = { rising: TrendingUp, steady: Minus, falling: TrendingDown } as const;

function Clusters() {
  const { actor } = useAuth();
  const queryClient = useQueryClient();
  const [converting, setConverting] = useState<ProblemCluster | null>(null);
  const [form, setForm] = useState({ title: "", expectedSolution: "", departmentId: "", weeks: "12", budget: "" });

  const clusters = useQuery({ queryKey: ["clusters"], queryFn: clusterService.list });
  const departments = useQuery({ queryKey: ["departments"], queryFn: referenceService.departments });

  const create = useMutation({
    mutationFn: () => {
      if (!actor || !converting) throw new Error("Not ready");
      return challengeService.create(
        {
          title: form.title || converting.title,
          clusterId: converting.id,
          problemStatement: `${converting.reportIds.length} verified citizen reports in ${converting.district} describe ${converting.title.toLowerCase()}.`,
          background: `Cluster ${converting.id} groups ${converting.reportIds.length} reports affecting ${converting.affectedPeople.toLocaleString("en-IN")} residents. Trend: ${converting.trend}.`,
          category: converting.category,
          district: converting.district,
          state: converting.state,
          departmentId: form.departmentId,
          expectedSolution: form.expectedSolution,
          affectedPeople: converting.affectedPeople,
          priorityScore: converting.priorityScore,
          timelineWeeks: Number(form.weeks),
          budget: form.budget,
        },
        actor,
      );
    },
    onSuccess: (challenge) => {
      toast.success(`Challenge ${challenge.code} created as a draft`);
      setConverting(null);
      void queryClient.invalidateQueries({ queryKey: ["challenges"] });
      void queryClient.invalidateQueries({ queryKey: ["clusters"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Clustering and priority"
        title="Problem clusters"
        description="Many individual complaints become one meaningful cluster. Priority is a weighted score over six visible factors — never an unexplained number."
      />

      <div className="mt-6">
        <DataState
          isLoading={clusters.isLoading}
          isError={clusters.isError}
          error={clusters.error}
          data={clusters.data}
          onRetry={() => void clusters.refetch()}
          loadingLabel="Loading clusters…"
          isEmpty={(d) => d.length === 0}
          emptyTitle="No clusters yet"
          emptyDescription="Verified reports in the same locality and category form clusters automatically."
        >
          {(data) => (
            <ul className="space-y-4">
              {[...data]
                .sort((a, b) => b.priorityScore - a.priorityScore)
                .map((cluster) => {
                  const TrendIcon = TREND_ICON[cluster.trend];
                  return (
                    <li key={cluster.id} className="rounded-md border border-border bg-card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">{cluster.id}</p>
                          <h2 className="mt-1 font-display text-lg font-semibold">{cluster.title}</h2>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <Pill>{cluster.category}</Pill>
                            <Pill>
                              {cluster.district}, {cluster.state}
                            </Pill>
                            <Pill>{cluster.reportIds.length} reports</Pill>
                            <Pill>{cluster.affectedPeople.toLocaleString("en-IN")} affected</Pill>
                            <Pill>{cluster.evidenceCount} evidence items</Pill>
                            <Pill>{cluster.geographicSpread}</Pill>
                            <Pill tone={cluster.trend === "rising" ? "danger" : "neutral"}>
                              <TrendIcon className="size-3" aria-hidden /> {cluster.trend}
                            </Pill>
                            <Pill tone={cluster.status === "converted" ? "success" : "info"}>{cluster.status}</Pill>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <PriorityBadge score={cluster.priorityScore} />
                          <Button
                            size="sm"
                            disabled={cluster.status === "converted"}
                            onClick={() => {
                              setConverting(cluster);
                              setForm({
                                title: cluster.title,
                                expectedSolution: "",
                                departmentId: cluster.departmentId ?? "",
                                weeks: "12",
                                budget: "",
                              });
                            }}
                          >
                            {cluster.status === "converted" ? "Challenge created" : "Create challenge"}
                          </Button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {cluster.priorityBreakdown.map((factor) => (
                          <FactorBar
                            key={factor.label}
                            label={factor.label}
                            detail={factor.detail}
                            valuePct={factor.normalized * 100}
                            weightPct={factor.weight * 100}
                          />
                        ))}
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </DataState>
      </div>

      <Dialog open={Boolean(converting)} onOpenChange={(open) => !open && setConverting(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create official challenge</DialogTitle>
            <DialogDescription>
              From cluster {converting?.id}. The challenge starts in DRAFT and must be published before teams can
              apply.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ctitle">Challenge title</Label>
              <Input id="ctitle" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="solution">Expected solution</Label>
              <Textarea
                id="solution"
                rows={3}
                value={form.expectedSolution}
                onChange={(e) => setForm({ ...form, expectedSolution: e.target.value })}
                placeholder="What outcome must the selected team deliver?"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="dept">Assign department</Label>
              <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                <SelectTrigger id="dept" className="mt-1.5 w-full">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {(departments.data ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="cweeks">Timeline (weeks)</Label>
                <Input id="cweeks" type="number" min={1} value={form.weeks} onChange={(e) => setForm({ ...form, weeks: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="cbudget">Budget requirement</Label>
                <Input id="cbudget" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="INR 12 lakh" className="mt-1.5" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={create.isPending || !form.title.trim() || !form.departmentId || !form.expectedSolution.trim()}
              onClick={() => create.mutate()}
            >
              {create.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />} Create challenge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
