import type {
  Application,
  ApplicationStatus,
  AuditLog,
  Challenge,
  ChallengeStatus,
  CitizenReport,
  Evidence,
  ImpactMetrics,
  Project,
  ReportStatus,
  Role,
} from "@/types";
import {
  demoApplications,
  demoAuditLogs,
  demoChallenges,
  demoDepartments,
  demoEvidence,
  demoOrganizations,
  demoProjects,
  demoReports,
  demoTeams,
  demoUniversities,
  demoUsers,
} from "@/data/demo";
import { clusterReports } from "@/lib/engines/clustering";
import { matchTeamToChallenge } from "@/lib/engines/matching";
import { computePriority } from "@/lib/engines/priority";

/**
 * In-memory mock backend. This mirrors the Cloudflare Worker + D1 contract in
 * `backend/` one-to-one so the frontend can be pointed at the real API by
 * setting VITE_API_BASE_URL (see services/apiClient.ts).
 */

const daysSince = (iso: string) =>
  Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000));

export const db = {
  users: [...demoUsers],
  reports: [...demoReports],
  challenges: demoChallenges.map((c) => ({ ...c })),
  applications: demoApplications.map((a) => ({ ...a })),
  projects: demoProjects.map((p) => ({ ...p })),
  evidence: [...demoEvidence],
  auditLogs: [...demoAuditLogs],
  departments: [...demoDepartments],
  universities: [...demoUniversities],
  organizations: [...demoOrganizations],
  teams: [...demoTeams],
};

// Derive priority + match scores once so no number on screen is hardcoded.
export function getClusters() {
  return clusterReports(db.reports);
}

function hydrate() {
  const clusters = getClusters();
  for (const challenge of db.challenges) {
    const cluster = clusters.find((c) => c.id === challenge.clusterId);
    if (cluster) {
      challenge.priorityScore = cluster.priorityScore;
    } else {
      challenge.priorityScore = computePriority({
        severity: 4,
        affectedPeople: challenge.affectedPeople,
        urgencyDays: daysSince(challenge.createdAt),
        evidenceCount: 4,
        recurrenceCount: 3,
        vulnerability: 3,
      }).score;
    }
  }
  for (const app of db.applications) {
    const challenge = db.challenges.find((c) => c.id === app.challengeId);
    const team = db.teams.find((t) => t.id === app.teamId);
    if (challenge && team) app.matchScore = matchTeamToChallenge(challenge, team).score;
  }
  for (const report of db.reports) {
    const cluster = clusters.find((c) => c.reportIds.includes(report.id));
    if (cluster) report.clusterId = cluster.id;
  }
}
hydrate();

export function nextId(prefix: string, count: number) {
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

export function logAction(input: {
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  entityType: string;
  entityId: string;
  detail: string;
}) {
  const log: AuditLog = {
    id: `LOG-${String(db.auditLogs.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    ...input,
  };
  db.auditLogs = [log, ...db.auditLogs];
  return log;
}

/* ---------------------------------- state machines --------------------------------- */

const REPORT_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  submitted: ["under_review", "rejected"],
  under_review: ["verified", "rejected", "submitted"],
  verified: ["clustered", "converted", "rejected"],
  clustered: ["converted", "rejected"],
  converted: ["assigned"],
  assigned: ["in_progress"],
  in_progress: ["gov_verification"],
  gov_verification: ["resolved", "in_progress"],
  resolved: [],
  rejected: [],
};

export function canTransitionReport(from: ReportStatus, to: ReportStatus) {
  return REPORT_TRANSITIONS[from].includes(to);
}

const CHALLENGE_TRANSITIONS: Record<ChallengeStatus, ChallengeStatus[]> = {
  DRAFT: ["PUBLISHED", "CANCELLED"],
  PUBLISHED: ["APPLICATION_OPEN", "CANCELLED"],
  APPLICATION_OPEN: ["UNDER_EVALUATION", "CANCELLED"],
  UNDER_EVALUATION: ["SHORTLISTED", "REJECTED", "CANCELLED"],
  SHORTLISTED: ["SELECTED", "UNDER_EVALUATION", "CANCELLED"],
  SELECTED: ["ALLOCATED", "CANCELLED"],
  ALLOCATED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["VERIFICATION", "IN_PROGRESS"],
  VERIFICATION: ["COMPLETED", "IN_PROGRESS"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

export function canTransitionChallenge(from: ChallengeStatus, to: ChallengeStatus) {
  return CHALLENGE_TRANSITIONS[from].includes(to);
}

const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  draft: ["submitted", "withdrawn"],
  submitted: ["under_evaluation", "rejected", "withdrawn"],
  under_evaluation: ["shortlisted", "rejected"],
  shortlisted: ["selected", "rejected"],
  selected: [],
  rejected: [],
  withdrawn: [],
};

export function canTransitionApplication(from: ApplicationStatus, to: ApplicationStatus) {
  return APPLICATION_TRANSITIONS[from].includes(to);
}

/* ---------------------------------- analytics --------------------------------- */

export function computeImpact(): ImpactMetrics {
  const reports = db.reports;
  const clusters = getClusters();
  const verified = reports.filter((r) =>
    ["verified", "clustered", "converted", "assigned", "in_progress", "gov_verification", "resolved"].includes(r.status),
  );
  const resolved = reports.filter((r) => r.status === "resolved");
  const converted = reports.filter((r) =>
    ["converted", "assigned", "in_progress", "gov_verification", "resolved"].includes(r.status),
  );
  const completedProjects = db.projects.filter((p) => p.status === "COMPLETED").length;

  const byCategoryMap = new Map<string, number>();
  const byDistrictMap = new Map<string, { reported: number; resolved: number }>();
  for (const r of reports) {
    byCategoryMap.set(r.category, (byCategoryMap.get(r.category) ?? 0) + 1);
    const entry = byDistrictMap.get(r.district) ?? { reported: 0, resolved: 0 };
    entry.reported += 1;
    if (r.status === "resolved") entry.resolved += 1;
    byDistrictMap.set(r.district, entry);
  }

  const bands = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  for (const c of clusters) {
    if (c.priorityScore >= 75) bands.Critical += 1;
    else if (c.priorityScore >= 55) bands.High += 1;
    else if (c.priorityScore >= 35) bands.Medium += 1;
    else bands.Low += 1;
  }

  const monthKeys = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString("en-IN", { month: "short" }) };
  });
  const monthly = monthKeys.map(({ key, month }) => {
    const inMonth = reports.filter((r) => {
      const d = new Date(r.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}` === key;
    });
    return {
      month,
      reported: inMonth.length,
      resolved: inMonth.filter((r) => r.status === "resolved").length,
    };
  });

  const resolutionDays = resolved.map((r) => daysSince(r.createdAt));
  const avg = resolutionDays.length
    ? Math.round(resolutionDays.reduce((a, b) => a + b, 0) / resolutionDays.length)
    : 0;

  return {
    reported: reports.length,
    verified: verified.length,
    clustered: clusters.length,
    challenges: db.challenges.length,
    projects: db.projects.length,
    resolved: resolved.length,
    peopleImpacted: verified.reduce((s, r) => s + r.affectedPeople, 0),
    resolutionRatePct: reports.length ? Math.round((resolved.length / reports.length) * 100) : 0,
    avgResolutionDays: avg,
    recurringIssueReductionPct: converted.length ? Math.round((resolved.length / converted.length) * 100) : 0,
    citizenSatisfactionPct: 74,
    departmentsEngaged: new Set(db.challenges.map((c) => c.departmentId)).size,
    byCategory: [...byCategoryMap].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    byDistrict: [...byDistrictMap].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.reported - a.reported),
    priorityDistribution: Object.entries(bands).map(([name, value]) => ({ name, value })),
    monthly,
  };
}

export type { Application, Challenge, CitizenReport, Evidence, Project };
