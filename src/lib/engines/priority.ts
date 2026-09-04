import type { PriorityFactor } from "@/types";

export interface PriorityInput {
  severity: number; // 1-5
  affectedPeople: number;
  urgencyDays: number; // days since first report
  evidenceCount: number;
  recurrenceCount: number; // number of related reports
  vulnerability: number; // 1-5
}

const WEIGHTS = {
  severity: 0.3,
  population: 0.25,
  urgency: 0.2,
  evidence: 0.1,
  recurrence: 0.1,
  equity: 0.05,
} as const;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Transparent Priority Engine — every factor is shown to the user. */
export function computePriority(input: PriorityInput): {
  score: number;
  breakdown: PriorityFactor[];
} {
  const norm = {
    severity: clamp01(input.severity / 5),
    population: clamp01(Math.log10(Math.max(1, input.affectedPeople)) / 4.5),
    urgency: clamp01(input.urgencyDays / 60),
    evidence: clamp01(input.evidenceCount / 12),
    recurrence: clamp01(input.recurrenceCount / 25),
    equity: clamp01(input.vulnerability / 5),
  };

  const breakdown: PriorityFactor[] = [
    {
      label: "Severity",
      weight: WEIGHTS.severity,
      normalized: norm.severity,
      contribution: norm.severity * WEIGHTS.severity * 100,
      detail: `Reported severity ${input.severity}/5`,
    },
    {
      label: "Affected population",
      weight: WEIGHTS.population,
      normalized: norm.population,
      contribution: norm.population * WEIGHTS.population * 100,
      detail: `${input.affectedPeople.toLocaleString("en-IN")} people affected (log-normalised)`,
    },
    {
      label: "Urgency",
      weight: WEIGHTS.urgency,
      normalized: norm.urgency,
      contribution: norm.urgency * WEIGHTS.urgency * 100,
      detail: `Pending for ${input.urgencyDays} days`,
    },
    {
      label: "Evidence strength",
      weight: WEIGHTS.evidence,
      normalized: norm.evidence,
      contribution: norm.evidence * WEIGHTS.evidence * 100,
      detail: `${input.evidenceCount} evidence items attached`,
    },
    {
      label: "Recurrence",
      weight: WEIGHTS.recurrence,
      normalized: norm.recurrence,
      contribution: norm.recurrence * WEIGHTS.recurrence * 100,
      detail: `${input.recurrenceCount} related citizen reports`,
    },
    {
      label: "Equity / vulnerability",
      weight: WEIGHTS.equity,
      normalized: norm.equity,
      contribution: norm.equity * WEIGHTS.equity * 100,
      detail: `Vulnerability index ${input.vulnerability}/5`,
    },
  ];

  const score = Number(breakdown.reduce((sum, f) => sum + f.contribution, 0).toFixed(1));
  return { score, breakdown };
}

export function priorityBand(score: number): "Critical" | "High" | "Medium" | "Low" {
  if (score >= 75) return "Critical";
  if (score >= 55) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}
