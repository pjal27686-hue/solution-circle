import { cn } from "@/lib/utils";
import {
  REPORT_STATUS_LABELS,
  type ApplicationStatus,
  type ChallengeStatus,
  type ProjectStatus,
  type ReportStatus,
} from "@/types";

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "primary";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-info/15 text-info border-info/30",
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
  primary: "bg-primary/15 text-primary border-primary/30",
};

const REPORT_TONE: Record<ReportStatus, Tone> = {
  submitted: "neutral",
  under_review: "info",
  verified: "primary",
  clustered: "primary",
  converted: "primary",
  assigned: "info",
  in_progress: "warning",
  gov_verification: "warning",
  resolved: "success",
  rejected: "danger",
};

const CHALLENGE_TONE: Partial<Record<ChallengeStatus, Tone>> = {
  DRAFT: "neutral",
  PUBLISHED: "info",
  APPLICATION_OPEN: "info",
  UNDER_EVALUATION: "warning",
  SHORTLISTED: "warning",
  SELECTED: "primary",
  ALLOCATED: "primary",
  ACCEPTED: "primary",
  IN_PROGRESS: "warning",
  SUBMITTED: "warning",
  VERIFICATION: "warning",
  COMPLETED: "success",
  REJECTED: "danger",
  CANCELLED: "danger",
};

const APPLICATION_TONE: Record<ApplicationStatus, Tone> = {
  draft: "neutral",
  submitted: "info",
  under_evaluation: "warning",
  shortlisted: "warning",
  selected: "success",
  rejected: "danger",
  withdrawn: "neutral",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-medium tracking-wide",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return <Pill tone={REPORT_TONE[status]}>{REPORT_STATUS_LABELS[status]}</Pill>;
}

export function ChallengeStatusBadge({ status }: { status: ChallengeStatus }) {
  return <Pill tone={CHALLENGE_TONE[status] ?? "neutral"}>{status.replace(/_/g, " ")}</Pill>;
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <Pill tone={APPLICATION_TONE[status]}>{status.replace(/_/g, " ")}</Pill>;
}

const PROJECT_TONE: Record<ProjectStatus, Tone> = {
  ALLOCATED: "info",
  ACCEPTED: "primary",
  IN_PROGRESS: "warning",
  SUBMITTED: "warning",
  VERIFICATION: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Pill tone={PROJECT_TONE[status]}>{status.replace(/_/g, " ")}</Pill>;
}

export function PriorityBadge({ score }: { score: number }) {
  const tone: Tone = score >= 75 ? "danger" : score >= 55 ? "warning" : score >= 35 ? "info" : "neutral";
  const band = score >= 75 ? "Critical" : score >= 55 ? "High" : score >= 35 ? "Medium" : "Low";
  return (
    <Pill tone={tone}>
      {band} · {score.toFixed(0)}
    </Pill>
  );
}

export function DemoBadge() {
  return (
    <Pill tone="neutral" className="uppercase">
      Demo data
    </Pill>
  );
}
