import type {
  Application,
  ApplicationStatus,
  Challenge,
  ChallengeStatus,
  CitizenReport,
  Evidence,
  Milestone,
  Project,
  ReportStatus,
  Role,
  User,
} from "@/types";
import {
  canTransitionApplication,
  canTransitionChallenge,
  canTransitionReport,
  computeImpact,
  db,
  getClusters,
  logAction,
} from "./store";
import { findDuplicates } from "@/lib/engines/duplicates";
import { structureProblem } from "@/lib/engines/structuring";
import { rankTeams } from "@/lib/engines/matching";

const LATENCY_MS = 220;

class MockError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

interface Actor {
  id: string;
  name: string;
  role: Role;
}

function actorFrom(body: unknown): Actor {
  const actor = (body as { actor?: Actor } | undefined)?.actor;
  if (!actor) throw new MockError("Unauthorized: no actor context", 401);
  return actor;
}

function requireRole(actor: Actor, roles: Role[]) {
  if (!roles.includes(actor.role)) {
    throw new MockError(`Forbidden: ${actor.role} cannot perform this action`, 403);
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function handleMockRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const [rawPath, queryString] = path.split("?");
  const segments = (rawPath ?? "").split("/").filter(Boolean); // ["api", ...]
  const query = new URLSearchParams(queryString ?? "");
  const route = segments.slice(1); // drop "api"
  const key = `${method} /${route.map((s, i) => (i > 0 && /^(RPT|CLS|CHL|APP|PRJ|EVD|USR|TEA)-/.test(s) ? ":id" : s)).join("/")}`;

  const result = await resolve(key, route, query, body);
  return delay(result as T);
}

async function resolve(
  key: string,
  route: string[],
  query: URLSearchParams,
  body: unknown,
): Promise<unknown> {
  switch (key) {
    /* ------------------------------- auth ------------------------------- */
    case "POST /auth/login": {
      const { email } = body as { email: string };
      const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) throw new MockError("No account found for this email address", 404);
      return { user, token: `demo-session-${user.id}` };
    }
    case "POST /auth/register": {
      const input = body as { name: string; email: string; role: Role; district?: string; state?: string };
      if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
        throw new MockError("An account with this email already exists", 409);
      }
      const user: User = {
        id: `USR-${String(db.users.length + 1).padStart(3, "0")}`,
        name: input.name,
        email: input.email,
        role: input.role,
        district: input.district,
        state: input.state,
        verified: false,
        demo: false,
      };
      db.users = [...db.users, user];
      return { user, token: `demo-session-${user.id}` };
    }

    /* ------------------------------ problems ---------------------------- */
    case "GET /problems": {
      const status = query.get("status");
      const district = query.get("district");
      const reporterId = query.get("reporterId");
      let reports = [...db.reports].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      if (status) reports = reports.filter((r) => r.status === status);
      if (district) reports = reports.filter((r) => r.district === district);
      if (reporterId) reports = reports.filter((r) => r.reporterId === reporterId);
      return reports;
    }
    case "GET /problems/:id": {
      const report = db.reports.find((r) => r.id === route[1]);
      if (!report) throw new MockError("Report not found", 404);
      return report;
    }
    case "POST /problems/structure": {
      const { text, severity } = body as { text: string; severity?: number };
      return structureProblem({ text, ...(severity ? { severity } : {}) });
    }
    case "POST /problems/duplicates": {
      const candidate = body as Parameters<typeof findDuplicates>[0];
      return findDuplicates(candidate, db.reports);
    }
    case "POST /problems": {
      const input = body as Omit<CitizenReport, "id" | "status" | "createdAt" | "updatedAt" | "structured" | "demo"> & {
        actor: Actor;
      };
      const actor = actorFrom(body);
      const structured = structureProblem({ text: `${input.title}. ${input.description}`, severity: input.severity });
      const report: CitizenReport = {
        ...input,
        id: `RPT-${1000 + db.reports.length + 1}`,
        category: structured.category,
        subcategory: structured.subcategory,
        status: "submitted",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        structured,
        reporterId: actor.id,
        reporterName: actor.name,
        demo: false,
      };
      db.reports = [report, ...db.reports];
      logAction({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "REPORT_SUBMITTED",
        entityType: "citizen_report",
        entityId: report.id,
        detail: `${report.title} (${report.district})`,
      });
      return report;
    }
    case "PATCH /problems/:id": {
      const actor = actorFrom(body);
      requireRole(actor, ["officer", "gov_admin", "platform_admin", "super_admin"]);
      const { status, reason } = body as { status: ReportStatus; reason?: string };
      const report = db.reports.find((r) => r.id === route[1]);
      if (!report) throw new MockError("Report not found", 404);
      if (!canTransitionReport(report.status, status)) {
        throw new MockError(`Invalid transition ${report.status} → ${status}`, 409);
      }
      report.status = status;
      report.updatedAt = new Date().toISOString();
      if (reason) report.rejectionReason = reason;
      logAction({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: `REPORT_${status.toUpperCase()}`,
        entityType: "citizen_report",
        entityId: report.id,
        detail: reason ?? `Status moved to ${status}`,
      });
      return report;
    }
    case "POST /problems/:id/merge": {
      const actor = actorFrom(body);
      requireRole(actor, ["officer", "gov_admin", "platform_admin", "super_admin"]);
      const { targetId } = body as { targetId: string };
      const source = db.reports.find((r) => r.id === route[1]);
      const target = db.reports.find((r) => r.id === targetId);
      if (!source || !target) throw new MockError("Report not found", 404);
      target.affectedPeople += source.affectedPeople;
      target.evidenceCount += source.evidenceCount;
      source.status = "clustered";
      source.clusterId = target.clusterId;
      logAction({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "REPORTS_MERGED",
        entityType: "citizen_report",
        entityId: source.id,
        detail: `Merged into ${target.id}`,
      });
      return { source, target };
    }

    /* ------------------------------ clusters ---------------------------- */
    case "GET /clusters":
      return getClusters();
    case "GET /clusters/:id": {
      const cluster = getClusters().find((c) => c.id === route[1]);
      if (!cluster) throw new MockError("Cluster not found", 404);
      return {
        cluster,
        reports: db.reports.filter((r) => cluster.reportIds.includes(r.id)),
      };
    }

    /* ----------------------------- challenges --------------------------- */
    case "GET /challenges": {
      const status = query.get("status");
      let list = [...db.challenges].sort((a, b) => b.priorityScore - a.priorityScore);
      if (status) list = list.filter((c) => c.status === status);
      return list;
    }
    case "GET /challenges/:id": {
      const challenge = db.challenges.find((c) => c.id === route[1]);
      if (!challenge) throw new MockError("Challenge not found", 404);
      return challenge;
    }
    case "POST /challenges": {
      const actor = actorFrom(body);
      requireRole(actor, ["officer", "gov_admin", "platform_admin", "super_admin"]);
      const input = body as Partial<Challenge> & { actor: Actor };
      const cluster = getClusters().find((c) => c.id === input.clusterId);
      const challenge: Challenge = {
        id: `CHL-${String(db.challenges.length + 1).padStart(3, "0")}`,
        code: `GEN/${(input.district ?? "PUN").slice(0, 3).toUpperCase()}/2026/${String(db.challenges.length + 1).padStart(3, "0")}`,
        title: input.title ?? "Untitled challenge",
        problemStatement: input.problemStatement ?? "",
        background: input.background ?? (cluster ? `Created from cluster ${cluster.id} with ${cluster.reportIds.length} citizen reports.` : ""),
        clusterId: input.clusterId,
        district: input.district ?? cluster?.district ?? "Pune",
        state: input.state ?? "Maharashtra",
        departmentId: input.departmentId ?? "DEP-001",
        category: input.category ?? cluster?.category ?? "Infrastructure",
        expectedSolution: input.expectedSolution ?? "",
        constraints: input.constraints ?? [],
        requiredSkills: input.requiredSkills ?? [],
        budget: input.budget ?? "To be determined",
        timelineWeeks: input.timelineWeeks ?? 12,
        successMetrics: input.successMetrics ?? [],
        evaluationCriteria: input.evaluationCriteria ?? [],
        evidenceRequirements: input.evidenceRequirements ?? [],
        status: "DRAFT",
        priorityScore: cluster?.priorityScore ?? 0,
        affectedPeople: cluster?.affectedPeople ?? 0,
        createdAt: new Date().toISOString(),
        deadline: new Date(Date.now() + (input.timelineWeeks ?? 12) * 7 * 86_400_000).toISOString(),
        demo: false,
      };
      db.challenges = [challenge, ...db.challenges];
      if (cluster) {
        for (const id of cluster.reportIds) {
          const report = db.reports.find((r) => r.id === id);
          if (report && canTransitionReport(report.status, "converted")) report.status = "converted";
        }
      }
      logAction({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "CHALLENGE_CREATED",
        entityType: "challenge",
        entityId: challenge.id,
        detail: `${challenge.title} from ${cluster?.id ?? "manual entry"}`,
      });
      return challenge;
    }
    case "PATCH /challenges/:id": {
      const actor = actorFrom(body);
      requireRole(actor, ["officer", "gov_admin", "platform_admin", "super_admin"]);
      const { status } = body as { status: ChallengeStatus };
      const challenge = db.challenges.find((c) => c.id === route[1]);
      if (!challenge) throw new MockError("Challenge not found", 404);
      if (!canTransitionChallenge(challenge.status, status)) {
        throw new MockError(`Invalid transition ${challenge.status} → ${status}`, 409);
      }
      challenge.status = status;
      logAction({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: `CHALLENGE_${status}`,
        entityType: "challenge",
        entityId: challenge.id,
        detail: `Lifecycle moved to ${status}`,
      });
      return challenge;
    }
    case "POST /challenges/:id/apply": {
      const actor = actorFrom(body);
      requireRole(actor, ["student", "university", "organization"]);
      const input = body as { teamId: string; proposal: Application["proposal"]; actor: Actor };
      const challenge = db.challenges.find((c) => c.id === route[1]);
      if (!challenge) throw new MockError("Challenge not found", 404);
      if (!["PUBLISHED", "APPLICATION_OPEN"].includes(challenge.status)) {
        throw new MockError("This challenge is not accepting applications", 409);
      }
      const team = db.teams.find((t) => t.id === input.teamId);
      if (!team) throw new MockError("Team not found", 404);
      if (db.applications.some((a) => a.challengeId === challenge.id && a.teamId === team.id)) {
        throw new MockError("This team has already applied to the challenge", 409);
      }
      const application: Application = {
        id: `APP-${String(db.applications.length + 1).padStart(3, "0")}`,
        challengeId: challenge.id,
        teamId: team.id,
        teamName: team.name,
        status: "submitted",
        matchScore: rankTeams(challenge, [team])[0]?.score ?? 0,
        submittedAt: new Date().toISOString(),
        proposal: input.proposal,
        demo: false,
      };
      db.applications = [application, ...db.applications];
      if (challenge.status === "PUBLISHED") challenge.status = "APPLICATION_OPEN";
      logAction({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "APPLICATION_SUBMITTED",
        entityType: "application",
        entityId: application.id,
        detail: `${team.name} applied to ${challenge.code}`,
      });
      return application;
    }

    /* ---------------------------- applications -------------------------- */
    case "GET /applications": {
      const challengeId = query.get("challengeId");
      const teamId = query.get("teamId");
      let list = [...db.applications];
      if (challengeId) list = list.filter((a) => a.challengeId === challengeId);
      if (teamId) list = list.filter((a) => a.teamId === teamId);
      return list.sort((a, b) => b.matchScore - a.matchScore);
    }
    case "PATCH /applications/:id": {
      const actor = actorFrom(body);
      requireRole(actor, ["officer", "gov_admin", "platform_admin", "super_admin"]);
      const { status, notes } = body as { status: ApplicationStatus; notes?: string };
      const application = db.applications.find((a) => a.id === route[1]);
      if (!application) throw new MockError("Application not found", 404);
      if (!canTransitionApplication(application.status, status)) {
        throw new MockError(`Invalid transition ${application.status} → ${status}`, 409);
      }
      if (status === "selected") {
        const conflicting = db.applications.find(
          (a) => a.challengeId === application.challengeId && a.status === "selected" && a.id !== application.id,
        );
        if (conflicting) throw new MockError("Another team is already selected for this challenge", 409);
      }
      application.status = status;
      if (notes) application.evaluationNotes = notes;
      logAction({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: `APPLICATION_${status.toUpperCase()}`,
        entityType: "application",
        entityId: application.id,
        detail: notes ?? `Application moved to ${status}`,
      });
      return application;
    }

    /* ------------------------------ projects ---------------------------- */
    case "GET /projects": {
      const teamId = query.get("teamId");
      let list = [...db.projects];
      if (teamId) list = list.filter((p) => p.teamId === teamId);
      return list;
    }
    case "GET /projects/:id": {
      const project = db.projects.find((p) => p.id === route[1]);
      if (!project) throw new MockError("Project not found", 404);
      const challenge = db.challenges.find((c) => c.id === project.challengeId);
      return {
        project,
        challenge,
        evidence: db.evidence.filter((e) => e.projectId === project.id),
      };
    }
    case "POST /projects": {
      const actor = actorFrom(body);
      requireRole(actor, ["officer", "gov_admin", "platform_admin", "super_admin"]);
      const { applicationId } = body as { applicationId: string };
      const application = db.applications.find((a) => a.id === applicationId);
      if (!application) throw new MockError("Application not found", 404);
      if (application.status !== "selected") throw new MockError("Only a selected application can be allocated", 409);
      if (db.projects.some((p) => p.challengeId === application.challengeId)) {
        throw new MockError("This challenge is already allocated to a project", 409);
      }
      const project = {
        id: `PRJ-${String(db.projects.length + 1).padStart(3, "0")}`,
        code: `PRJ/GEN/2026/${String(db.projects.length + 1).padStart(3, "0")}`,
        challengeId: application.challengeId,
        teamId: application.teamId,
        teamName: application.teamName,
        officerId: actor.id,
        officerName: actor.name,
        status: "ALLOCATED" as const,
        progress: 0,
        startedAt: new Date().toISOString(),
        dueAt: new Date(Date.now() + 84 * 86_400_000).toISOString(),
        milestones: [] as Milestone[],
        tasks: [],
        updates: [],
        demo: false,
      };
      db.projects = [project, ...db.projects];
      logAction({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "PROJECT_ALLOCATED",
        entityType: "project",
        entityId: project.id,
        detail: `${application.teamName} allocated to ${application.challengeId}`,
      });
      return project;
    }
    case "PATCH /projects/:id": {
      const actor = actorFrom(body);
      const { status, progress } = body as { status?: Project["status"]; progress?: number };
      const project = db.projects.find((p) => p.id === route[1]);
      if (!project) throw new MockError("Project not found", 404);
      if (status) project.status = status;
      if (progress != null) project.progress = progress;
      logAction({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "PROJECT_UPDATED",
        entityType: "project",
        entityId: project.id,
        detail: status ? `Status ${status}` : `Progress ${progress}%`,
      });
      return project;
    }
    case "POST /projects/:id/milestones": {
      const actor = actorFrom(body);
      const project = db.projects.find((p) => p.id === route[1]);
      if (!project) throw new MockError("Project not found", 404);
      const { milestoneId, status } = body as { milestoneId: string; status: Milestone["status"] };
      const milestone = project.milestones.find((m) => m.id === milestoneId);
      if (!milestone) throw new MockError("Milestone not found", 404);
      if (status === "approved") requireRole(actor, ["officer", "gov_admin", "platform_admin", "super_admin"]);
      milestone.status = status;
      milestone.progress = status === "approved" ? 100 : status === "submitted" ? Math.max(90, milestone.progress) : milestone.progress;
      project.progress = Math.round(
        project.milestones.reduce((s, m) => s + m.progress, 0) / Math.max(1, project.milestones.length),
      );
      logAction({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: `MILESTONE_${status.toUpperCase()}`,
        entityType: "project_milestone",
        entityId: milestone.id,
        detail: `${milestone.title} → ${status}`,
      });
      return project;
    }
    case "POST /projects/:id/evidence": {
      const actor = actorFrom(body);
      const project = db.projects.find((p) => p.id === route[1]);
      if (!project) throw new MockError("Project not found", 404);
      const input = body as { label: string; kind: Evidence["kind"]; sizeKb: number; actor: Actor };
      const evidence: Evidence = {
        id: `EVD-${String(db.evidence.length + 1).padStart(3, "0")}`,
        projectId: project.id,
        kind: input.kind,
        label: input.label,
        storageKey: `r2://evidence/${project.id}/${input.label.toLowerCase().replace(/\s+/g, "-")}`,
        ownerId: actor.id,
        ownerName: actor.name,
        createdAt: new Date().toISOString(),
        verificationState: "pending",
        sizeKb: input.sizeKb,
        demo: false,
      };
      db.evidence = [evidence, ...db.evidence];
      logAction({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "EVIDENCE_UPLOADED",
        entityType: "project_evidence",
        entityId: evidence.id,
        detail: `${evidence.label} (${evidence.kind})`,
      });
      return evidence;
    }
    case "PATCH /evidence/:id": {
      const actor = actorFrom(body);
      requireRole(actor, ["officer", "gov_admin", "platform_admin", "super_admin"]);
      const { verificationState } = body as { verificationState: Evidence["verificationState"] };
      const evidence = db.evidence.find((e) => e.id === route[1]);
      if (!evidence) throw new MockError("Evidence not found", 404);
      evidence.verificationState = verificationState;
      logAction({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: `EVIDENCE_${verificationState.toUpperCase()}`,
        entityType: "project_evidence",
        entityId: evidence.id,
        detail: evidence.label,
      });
      return evidence;
    }
    case "GET /evidence":
      return [...db.evidence];

    /* ------------------------------- matches ---------------------------- */
    case "GET /matches": {
      const challengeId = query.get("challengeId");
      if (challengeId) {
        const challenge = db.challenges.find((c) => c.id === challengeId);
        if (!challenge) throw new MockError("Challenge not found", 404);
        return rankTeams(challenge, db.teams);
      }
      const teamId = query.get("teamId");
      const team = db.teams.find((t) => t.id === teamId);
      if (!team) throw new MockError("Team not found", 404);
      const open = db.challenges.filter((c) => ["PUBLISHED", "APPLICATION_OPEN"].includes(c.status));
      return open
        .map((c) => rankTeams(c, [team])[0])
        .filter((m): m is NonNullable<typeof m> => Boolean(m))
        .sort((a, b) => b.score - a.score);
    }

    /* --------------------------- reference data ------------------------- */
    case "GET /impact":
      return computeImpact();
    case "GET /analytics":
      return computeImpact();
    case "GET /teams":
      return [...db.teams];
    case "GET /departments":
      return [...db.departments];
    case "GET /universities":
      return [...db.universities];
    case "GET /organizations":
      return [...db.organizations];
    case "GET /users":
      return [...db.users];
    case "GET /admin/audit-logs":
      return [...db.auditLogs];
    default:
      throw new MockError(`No mock handler for ${key}`, 404);
  }
}
