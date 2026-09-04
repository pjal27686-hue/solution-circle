import { api } from "./apiClient";
import type {
  Application,
  ApplicationStatus,
  AuditLog,
  Challenge,
  ChallengeStatus,
  CitizenReport,
  Department,
  Evidence,
  ImpactMetrics,
  Milestone,
  Organization,
  Problem,
  ProblemCluster,
  Project,
  ProjectStatus,
  ReportStatus,
  Role,
  StructuredProblem,
  Team,
  University,
  User,
} from "@/types";
import type { DuplicateCandidateInput, DuplicateMatch } from "@/lib/engines/duplicates";
import type { MatchResult } from "@/types";

export interface Actor {
  id: string;
  name: string;
  role: Role;
}

const qs = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) search.set(k, v);
  });
  const s = search.toString();
  return s ? `?${s}` : "";
};

/* --------------------------------- auth --------------------------------- */
export const authService = {
  login: (email: string) => api<{ user: User; token: string }>("/auth/login", { method: "POST", body: { email } }),
  register: (input: { name: string; email: string; role: Role; district?: string; state?: string }) =>
    api<{ user: User; token: string }>("/auth/register", { method: "POST", body: input }),
};

/* ------------------------------- problems ------------------------------- */
export const problemService = {
  list: (filters: { status?: ReportStatus; district?: string; reporterId?: string } = {}) =>
    api<CitizenReport[]>(`/problems${qs(filters)}`),
  get: (id: string) => api<CitizenReport>(`/problems/${id}`),
  structure: (text: string, severity?: number) =>
    api<StructuredProblem>("/problems/structure", { method: "POST", body: { text, severity } }),
  duplicates: (candidate: DuplicateCandidateInput) =>
    api<DuplicateMatch[]>("/problems/duplicates", { method: "POST", body: candidate }),
  create: (input: Record<string, unknown>, actor: Actor) =>
    api<CitizenReport>("/problems", { method: "POST", body: { ...input, actor } }),
  setStatus: (id: string, status: ReportStatus, actor: Actor, reason?: string) =>
    api<CitizenReport>(`/problems/${id}`, { method: "PATCH", body: { status, reason, actor } }),
  merge: (id: string, targetId: string, actor: Actor) =>
    api<{ source: CitizenReport; target: CitizenReport }>(`/problems/${id}/merge`, {
      method: "POST",
      body: { targetId, actor },
    }),
};

/* ------------------------------- clusters ------------------------------- */
export const clusterService = {
  list: () => api<ProblemCluster[]>("/clusters"),
  get: (id: string) => api<{ cluster: ProblemCluster; reports: CitizenReport[] }>(`/clusters/${id}`),
};

/* ------------------------------ challenges ------------------------------ */
export const challengeService = {
  list: (status?: ChallengeStatus) => api<Challenge[]>(`/challenges${qs({ status })}`),
  get: (id: string) => api<Challenge>(`/challenges/${id}`),
  create: (input: Partial<Challenge>, actor: Actor) =>
    api<Challenge>("/challenges", { method: "POST", body: { ...input, actor } }),
  setStatus: (id: string, status: ChallengeStatus, actor: Actor) =>
    api<Challenge>(`/challenges/${id}`, { method: "PATCH", body: { status, actor } }),
  apply: (id: string, input: { teamId: string; proposal: Application["proposal"] }, actor: Actor) =>
    api<Application>(`/challenges/${id}/apply`, { method: "POST", body: { ...input, actor } }),
};

/* ----------------------------- applications ----------------------------- */
export const applicationService = {
  list: (filters: { challengeId?: string; teamId?: string } = {}) =>
    api<Application[]>(`/applications${qs(filters)}`),
  setStatus: (id: string, status: ApplicationStatus, actor: Actor, notes?: string) =>
    api<Application>(`/applications/${id}`, { method: "PATCH", body: { status, notes, actor } }),
};

/* ------------------------------- projects ------------------------------- */
export const projectService = {
  list: (filters: { teamId?: string } = {}) => api<Project[]>(`/projects${qs(filters)}`),
  get: (id: string) =>
    api<{ project: Project; challenge?: Challenge; evidence: Evidence[] }>(`/projects/${id}`),
  allocate: (applicationId: string, actor: Actor) =>
    api<Project>("/projects", { method: "POST", body: { applicationId, actor } }),
  update: (id: string, input: { status?: ProjectStatus; progress?: number }, actor: Actor) =>
    api<Project>(`/projects/${id}`, { method: "PATCH", body: { ...input, actor } }),
  setMilestone: (id: string, milestoneId: string, status: Milestone["status"], actor: Actor) =>
    api<Project>(`/projects/${id}/milestones`, { method: "POST", body: { milestoneId, status, actor } }),
  addEvidence: (
    id: string,
    input: { label: string; kind: Evidence["kind"]; sizeKb: number },
    actor: Actor,
  ) => api<Evidence>(`/projects/${id}/evidence`, { method: "POST", body: { ...input, actor } }),
};

export const evidenceService = {
  list: () => api<Evidence[]>("/evidence"),
  verify: (id: string, verificationState: Evidence["verificationState"], actor: Actor) =>
    api<Evidence>(`/evidence/${id}`, { method: "PATCH", body: { verificationState, actor } }),
};

/* -------------------------------- matches ------------------------------- */
export const matchService = {
  forChallenge: (challengeId: string) => api<MatchResult[]>(`/matches${qs({ challengeId })}`),
  forTeam: (teamId: string) => api<MatchResult[]>(`/matches${qs({ teamId })}`),
};

/* ------------------------------- reference ------------------------------ */
export const referenceService = {
  teams: () => api<Team[]>("/teams"),
  departments: () => api<Department[]>("/departments"),
  universities: () => api<University[]>("/universities"),
  organizations: () => api<Organization[]>("/organizations"),
  users: () => api<User[]>("/users"),
};

export const analyticsService = {
  impact: () => api<ImpactMetrics>("/impact"),
  auditLogs: () => api<AuditLog[]>("/admin/audit-logs"),
};

export type { Problem };
