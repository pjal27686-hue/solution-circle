export type Role =
  | "citizen"
  | "student"
  | "university"
  | "organization"
  | "officer"
  | "gov_admin"
  | "platform_admin"
  | "super_admin";

export const ROLE_LABELS: Record<Role, string> = {
  citizen: "Citizen",
  student: "Student",
  university: "University Coordinator",
  organization: "Industry / NGO",
  officer: "Government Officer",
  gov_admin: "Government Administrator",
  platform_admin: "Platform Administrator",
  super_admin: "Super Admin",
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  district?: string | undefined;
  state?: string | undefined;
  organizationId?: string | undefined;
  universityId?: string | undefined;
  departmentId?: string | undefined;
  trustScore?: number | undefined;
  verified: boolean;
  demo: boolean;
}

export type ReportStatus =
  | "submitted"
  | "under_review"
  | "verified"
  | "clustered"
  | "converted"
  | "assigned"
  | "in_progress"
  | "gov_verification"
  | "resolved"
  | "rejected";

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  verified: "Verified",
  clustered: "Clustered",
  converted: "Converted to Challenge",
  assigned: "Assigned",
  in_progress: "In Progress",
  gov_verification: "Government Verification",
  resolved: "Resolved",
  rejected: "Rejected",
};

export const REPORT_TIMELINE: ReportStatus[] = [
  "submitted",
  "under_review",
  "verified",
  "clustered",
  "converted",
  "assigned",
  "in_progress",
  "gov_verification",
  "resolved",
];

export interface StructuredProblem {
  category: string;
  subcategory: string;
  issues: string[];
  severityLabel: string;
  affectedGroup: string;
  keywords: string[];
  confidence: number;
}

export interface CitizenReport {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  locality: string;
  district: string;
  state: string;
  lat?: number | undefined;
  lng?: number | undefined;
  severity: number;
  affectedPeople: number;
  frequency: "one_time" | "occasional" | "frequent" | "continuous";
  vulnerability: number;
  evidenceCount: number;
  status: ReportStatus;
  reporterId: string;
  reporterName: string;
  createdAt: string;
  updatedAt: string;
  clusterId?: string | undefined;
  rejectionReason?: string | undefined;
  structured?: StructuredProblem | undefined;
  demo: boolean;
}

export interface ProblemCluster {
  id: string;
  title: string;
  category: string;
  district: string;
  state: string;
  reportIds: string[];
  affectedPeople: number;
  evidenceCount: number;
  geographicSpread: string;
  trend: "rising" | "steady" | "falling";
  priorityScore: number;
  priorityBreakdown: PriorityFactor[];
  status: "open" | "verified" | "converted" | "resolved";
  departmentId?: string | undefined;
  createdAt: string;
  demo: boolean;
}

export interface PriorityFactor {
  label: string;
  weight: number;
  normalized: number;
  contribution: number;
  detail: string;
}

export type ChallengeStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "APPLICATION_OPEN"
  | "UNDER_EVALUATION"
  | "SHORTLISTED"
  | "SELECTED"
  | "ALLOCATED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "VERIFICATION"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export const CHALLENGE_FLOW: ChallengeStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "APPLICATION_OPEN",
  "UNDER_EVALUATION",
  "SHORTLISTED",
  "SELECTED",
  "ALLOCATED",
  "ACCEPTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "VERIFICATION",
  "COMPLETED",
];

export interface Challenge {
  id: string;
  code: string;
  title: string;
  problemStatement: string;
  background: string;
  clusterId?: string | undefined;
  district: string;
  state: string;
  departmentId: string;
  category: string;
  expectedSolution: string;
  constraints: string[];
  requiredSkills: string[];
  budget: string;
  timelineWeeks: number;
  successMetrics: string[];
  evaluationCriteria: string[];
  evidenceRequirements: string[];
  status: ChallengeStatus;
  priorityScore: number;
  affectedPeople: number;
  createdAt: string;
  deadline: string;
  demo: boolean;
}

export interface Department {
  id: string;
  name: string;
  state: string;
  openChallenges: number;
  demo: boolean;
}

export interface University {
  id: string;
  name: string;
  district: string;
  state: string;
  verified: boolean;
  studentCount: number;
  demo: boolean;
}

export interface Organization {
  id: string;
  name: string;
  sector: string;
  type: "industry" | "ngo";
  district: string;
  state: string;
  teamSize: number;
  skills: string[];
  domains: string[];
  pastProjects: number;
  verified: boolean;
  trustScore: number;
  demo: boolean;
}

export interface Team {
  id: string;
  name: string;
  universityId?: string | undefined;
  organizationId?: string | undefined;
  memberIds: string[];
  memberNames: string[];
  skills: string[];
  domains: string[];
  district: string;
  state: string;
  capacity: number;
  completedProjects: number;
  onTimeRate: number;
  trustScore: number;
  verified: boolean;
  demo: boolean;
}

export interface MatchFactor {
  label: string;
  weight: number;
  score: number;
  detail: string;
}

export interface MatchResult {
  teamId: string;
  teamName: string;
  challengeId: string;
  score: number;
  factors: MatchFactor[];
}

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_evaluation"
  | "shortlisted"
  | "selected"
  | "rejected"
  | "withdrawn";

export interface Application {
  id: string;
  challengeId: string;
  teamId: string;
  teamName: string;
  status: ApplicationStatus;
  matchScore: number;
  submittedAt: string;
  proposal: Proposal;
  evaluationNotes?: string | undefined;
  demo: boolean;
}

export interface Proposal {
  approach: string;
  timelineWeeks: number;
  budget: string;
  deliverables: string[];
  risks: string[];
}

export type ProjectStatus =
  | "ALLOCATED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "VERIFICATION"
  | "COMPLETED"
  | "CANCELLED";

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  status: "pending" | "in_progress" | "submitted" | "approved";
  progress: number;
}

export interface ProjectTask {
  id: string;
  title: string;
  assignee: string;
  status: "todo" | "doing" | "done";
}

export interface Evidence {
  id: string;
  projectId: string;
  kind: "image" | "document" | "report" | "before_after" | "location" | "completion";
  label: string;
  storageKey: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  verificationState: "pending" | "verified" | "rejected";
  sizeKb: number;
  demo: boolean;
}

export interface ProjectUpdate {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface Project {
  id: string;
  code: string;
  challengeId: string;
  teamId: string;
  teamName: string;
  officerId: string;
  officerName: string;
  universityId?: string | undefined;
  mentorOrganizationId?: string | undefined;
  status: ProjectStatus;
  progress: number;
  startedAt: string;
  dueAt: string;
  milestones: Milestone[];
  tasks: ProjectTask[];
  updates: ProjectUpdate[];
  demo: boolean;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  entityType: string;
  entityId: string;
  detail: string;
  createdAt: string;
}

export interface ImpactMetrics {
  reported: number;
  verified: number;
  clustered: number;
  challenges: number;
  projects: number;
  resolved: number;
  peopleImpacted: number;
  resolutionRatePct: number;
  avgResolutionDays: number;
  recurringIssueReductionPct: number;
  citizenSatisfactionPct: number;
  departmentsEngaged: number;
  byCategory: { name: string; value: number }[];
  byDistrict: { name: string; reported: number; resolved: number }[];
  priorityDistribution: { name: string; value: number }[];
  monthly: { month: string; reported: number; resolved: number }[];
}

export interface TrustBreakdown {
  label: string;
  points: number;
  detail: string;
}
