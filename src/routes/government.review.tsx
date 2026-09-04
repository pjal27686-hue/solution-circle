import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, GitMerge, Loader2, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireRole, useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/common/StatCard";
import { DataState } from "@/components/common/DataState";
import { Pill, ReportStatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { problemService } from "@/services";
import type { CitizenReport, ReportStatus } from "@/types";

export const Route = createFileRoute("/government/review")({
  head: () => ({
    meta: [
      { title: "Problem verification queue — government review" },
      {
        name: "description",
        content:
          "Verify, reject with reason, request more evidence or merge duplicate citizen reports. Every action is written to the audit log.",
      },
      { property: "og:title", content: "Problem verification queue — CivicBridge" },
      { property: "og:description", content: "Officer review workflow for citizen problem reports." },
    ],
  }),
  component: () => (
    <RequireRole roles={["officer", "gov_admin", "platform_admin", "super_admin"]}>
      <ReviewQueue />
    </RequireRole>
  ),
});

const FILTERS: { value: ReportStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "verified", label: "Verified" },
  { value: "clustered", label: "Clustered" },
  { value: "rejected", label: "Rejected" },
];

function ReviewQueue() {
  const { actor } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ReportStatus | "all">("submitted");
  const [rejecting, setRejecting] = useState<CitizenReport | null>(null);
  const [reason, setReason] = useState("");
  const [merging, setMerging] = useState<CitizenReport | null>(null);
  const [mergeTarget, setMergeTarget] = useState("");

  const query = useQuery({ queryKey: ["problems", {}], queryFn: () => problemService.list() });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["problems"] });
    void queryClient.invalidateQueries({ queryKey: ["impact"] });
    void queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
  };

  const setStatus = useMutation({
    mutationFn: ({ id, status, why }: { id: string; status: ReportStatus; why?: string }) => {
      if (!actor) throw new Error("Not signed in");
      return problemService.setStatus(id, status, actor, why);
    },
    onSuccess: (report) => {
      toast.success(`${report.id} moved to ${report.status.replace(/_/g, " ")}`);
      setRejecting(null);
      setReason("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const merge = useMutation({
    mutationFn: ({ id, targetId }: { id: string; targetId: string }) => {
      if (!actor) throw new Error("Not signed in");
      return problemService.merge(id, targetId, actor);
    },
    onSuccess: () => {
      toast.success("Reports merged — the duplicate is retained and linked, not deleted");
      setMerging(null);
      setMergeTarget("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = (query.data ?? []).filter((r) => filter === "all" || r.status === filter);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Verification"
        title="Problem review queue"
        description="Verify, reject with a reason, request more evidence, or merge duplicates. Rejections require a reason and are visible to the citizen."
        actions={
          <Select value={filter} onValueChange={(v) => setFilter(v as ReportStatus | "all")}>
            <SelectTrigger className="w-48" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="mt-6">
        <DataState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          data={rows}
          onRetry={() => void query.refetch()}
          loadingLabel="Loading reports…"
          isEmpty={(d) => d.length === 0}
          emptyTitle="Nothing in this view"
          emptyDescription="Change the status filter to see other reports."
        >
          {(data) => (
            <ul className="space-y-3">
              {data.map((report) => (
                <li key={report.id} className="rounded-md border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{report.id}</p>
                      <h2 className="mt-1 font-display text-base font-semibold">{report.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
                    </div>
                    <ReportStatusBadge status={report.status} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Pill>{report.category}</Pill>
                    <Pill>{report.subcategory}</Pill>
                    <Pill>
                      {report.locality}, {report.district}
                    </Pill>
                    <Pill>Severity {report.severity}/5</Pill>
                    <Pill>{report.affectedPeople.toLocaleString("en-IN")} affected</Pill>
                    <Pill>{report.evidenceCount} evidence items</Pill>
                    {report.mergedInto && <Pill tone="warning">merged into {report.mergedInto}</Pill>}
                  </div>

                  {report.rejectionReason && (
                    <p className="mt-3 rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      Rejection reason: {report.rejectionReason}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={setStatus.isPending || report.status === "verified"}
                      onClick={() => setStatus.mutate({ id: report.id, status: "verified" })}
                    >
                      {setStatus.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <BadgeCheck className="size-4" aria-hidden />}
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStatus.mutate({ id: report.id, status: "under_review" })}
                      disabled={setStatus.isPending}
                    >
                      Request more evidence
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setMerging(report)}>
                      <GitMerge className="size-4" aria-hidden /> Merge duplicate
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setRejecting(report)}>
                      <X className="size-4" aria-hidden /> Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DataState>
      </div>

      {/* Reject dialog */}
      <Dialog open={Boolean(rejecting)} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejecting?.id}</DialogTitle>
            <DialogDescription>
              A reason is mandatory and is shown to the citizen on their report timeline.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Falls under a private housing society, not municipal jurisdiction"
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={!reason.trim() || setStatus.isPending}
              onClick={() =>
                rejecting && setStatus.mutate({ id: rejecting.id, status: "rejected", why: reason.trim() })
              }
            >
              Reject report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge dialog */}
      <Dialog open={Boolean(merging)} onOpenChange={(open) => !open && setMerging(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge {merging?.id} into another report</DialogTitle>
            <DialogDescription>
              The duplicate is retained and linked so the citizen keeps visibility. Nothing is deleted.
            </DialogDescription>
          </DialogHeader>
          <Select value={mergeTarget} onValueChange={setMergeTarget}>
            <SelectTrigger aria-label="Target report">
              <SelectValue placeholder="Select the report to keep" />
            </SelectTrigger>
            <SelectContent>
              {(query.data ?? [])
                .filter((r) => r.id !== merging?.id && !r.mergedInto)
                .map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.id} — {r.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              disabled={!mergeTarget || merge.isPending}
              onClick={() => merging && merge.mutate({ id: merging.id, targetId: mergeTarget })}
            >
              Merge reports
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
