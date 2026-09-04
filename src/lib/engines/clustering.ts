import type { CitizenReport, ProblemCluster } from "@/types";
import { tokenize } from "./structuring";
import { computePriority } from "./priority";

function overlap(a: string[], b: string[]): number {
  const setB = new Set(b);
  const inter = a.filter((t) => setB.has(t)).length;
  return inter / Math.max(1, Math.min(a.length, b.length));
}

function daysSince(iso: string): number {
  return Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

/**
 * Civic Clustering Engine — greedy agglomeration on
 * (category, district) buckets with keyword overlap inside each bucket.
 */
export function clusterReports(reports: CitizenReport[]): ProblemCluster[] {
  const eligible = reports.filter((r) => r.status !== "rejected");
  const buckets = new Map<string, CitizenReport[]>();
  for (const r of eligible) {
    const key = `${r.category}::${r.district}`;
    buckets.set(key, [...(buckets.get(key) ?? []), r]);
  }

  const clusters: ProblemCluster[] = [];
  let index = 1;

  for (const [key, bucket] of buckets) {
    const groups: CitizenReport[][] = [];
    for (const report of bucket) {
      const tokens = tokenize(`${report.title} ${report.description}`);
      const group = groups.find((g) =>
        g.some((member) => overlap(tokens, tokenize(`${member.title} ${member.description}`)) >= 0.22),
      );
      if (group) group.push(report);
      else groups.push([report]);
    }

    for (const group of groups) {
      const [category, district] = key.split("::");
      const first = group.reduce((a, b) => (a.createdAt < b.createdAt ? a : b));
      const affectedPeople = group.reduce((s, r) => s + r.affectedPeople, 0);
      const evidenceCount = group.reduce((s, r) => s + r.evidenceCount, 0);
      const severity = Math.max(...group.map((r) => r.severity));
      const vulnerability = Math.max(...group.map((r) => r.vulnerability));
      const localities = Array.from(new Set(group.map((r) => r.locality)));
      const { score, breakdown } = computePriority({
        severity,
        affectedPeople,
        urgencyDays: daysSince(first.createdAt),
        evidenceCount,
        recurrenceCount: group.length,
        vulnerability,
      });

      const recent = group.filter((r) => daysSince(r.createdAt) <= 21).length;

      clusters.push({
        id: `CLS-${String(index).padStart(3, "0")}`,
        title: `${first.structured?.issues[0] ?? category} — ${localities[0]}, ${district}`,
        category: category ?? "General Civic",
        district: district ?? "—",
        state: first.state,
        reportIds: group.map((r) => r.id),
        affectedPeople,
        evidenceCount,
        geographicSpread: `${localities.length} localit${localities.length === 1 ? "y" : "ies"}`,
        trend: recent > group.length / 2 ? "rising" : recent === 0 ? "falling" : "steady",
        priorityScore: score,
        priorityBreakdown: breakdown,
        status: group.some((r) => r.status === "converted" || r.status === "assigned" || r.status === "in_progress")
          ? "converted"
          : group.every((r) => r.status === "resolved")
            ? "resolved"
            : group.some((r) => r.status === "verified" || r.status === "clustered")
              ? "verified"
              : "open",
        createdAt: first.createdAt,
        demo: group.every((r) => r.demo),
      });
      index += 1;
    }
  }

  return clusters.sort((a, b) => b.priorityScore - a.priorityScore);
}
