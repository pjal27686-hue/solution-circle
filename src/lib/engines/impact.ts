import { structureProblem, tokenize } from "./structuring";

/**
 * Impact Suggestion Engine — deterministic, explainable, dependency-free.
 * Generates candidate impacts, a risk percentage and an impact description from
 * the domain / challenge text entered in step 1. Suggestions are advisory only:
 * the UI never overwrites what the student typed without an explicit action.
 */

export interface ImpactSuggestion {
  impacts: string[];
  riskPercent: number;
  riskRationale: string[];
  description: string;
  missedRisks: string[];
  category: string;
  subcategory: string;
  confidence: number;
}

const IMPACTS_BY_CATEGORY: Record<string, string[]> = {
  Infrastructure: [
    "Daily commute delays and vehicle damage for residents",
    "Higher accident risk for two-wheelers and pedestrians",
    "Emergency vehicles slowed down on the affected stretch",
  ],
  "Water & Sanitation": [
    "Stagnant water causing mosquito breeding and disease risk",
    "Households losing safe drinking water access",
    "Ground floor homes and shops flooding during rain",
  ],
  Sanitation: [
    "Foul smell and unhygienic surroundings for nearby homes",
    "Stray animal and pest activity around the waste point",
    "Higher risk of skin and stomach infections",
  ],
  Utilities: [
    "Unsafe movement after dark, especially for women",
    "Increased petty crime in unlit stretches",
    "Shops closing earlier, losing daily income",
  ],
  Transport: [
    "Long waiting time and crowding for daily commuters",
    "Students reaching school or college late",
    "Traffic congestion spilling into nearby lanes",
  ],
  Education: [
    "Learning hours lost for enrolled students",
    "Higher dropout risk among girl students",
    "Unsafe classroom or sanitation conditions",
  ],
  Health: [
    "Delayed treatment for patients needing daily care",
    "Outbreak risk spreading across the locality",
    "Out-of-pocket spending on private care",
  ],
  "General Civic": [
    "Reduced quality of daily life in the locality",
    "Repeated complaints with no lasting resolution",
    "Loss of public trust in local services",
  ],
};

const MISSED_RISKS: { when: (text: string) => boolean; risk: string }[] = [
  { when: (t) => /rain|monsoon|flood|water/.test(t), risk: "Monsoon escalation — the problem may worsen sharply during rains" },
  { when: (t) => /school|student|children|college/.test(t), risk: "Child safety exposure on the daily route to school" },
  { when: (t) => /hospital|clinic|patient|elder/.test(t), risk: "Access barrier for patients and elderly residents" },
  { when: (t) => /night|dark|light/.test(t), risk: "Night-time safety risk, particularly for women and workers" },
  { when: (t) => /garbage|waste|sewage|drain/.test(t), risk: "Public health / vector-borne disease risk if left untreated" },
  { when: (t) => /traffic|bus|road|accident/.test(t), risk: "Road accident liability for the local body" },
  { when: () => true, risk: "Recurrence risk — a temporary fix may bring the problem back next season" },
  { when: () => true, risk: "Cost escalation — delayed action usually increases repair cost" },
];

export function suggestImpact(input: {
  title: string;
  description: string;
  affectedPeople?: number;
  frequency?: string;
  vulnerability?: number;
}): ImpactSuggestion {
  const text = `${input.title}. ${input.description}`;
  const lower = text.toLowerCase();
  const structured = structureProblem({ text });

  const impacts = IMPACTS_BY_CATEGORY[structured.category] ?? IMPACTS_BY_CATEGORY["General Civic"]!;

  const severityBase =
    structured.severityLabel === "Critical" ? 80 : structured.severityLabel === "High" ? 65 : structured.severityLabel === "Moderate" ? 45 : 25;

  const people = input.affectedPeople ?? 0;
  const peopleBoost = people >= 5000 ? 12 : people >= 1000 ? 8 : people >= 250 ? 5 : people > 0 ? 2 : 0;
  const frequencyBoost =
    input.frequency === "continuous" ? 8 : input.frequency === "frequent" ? 5 : input.frequency === "occasional" ? 2 : 0;
  const vulnerabilityBoost = Math.max(0, ((input.vulnerability ?? 3) - 3) * 3);
  const safetyBoost = /accident|unsafe|dangerous|injury|disease|dengue/.test(lower) ? 6 : 0;

  const riskPercent = Math.max(
    0,
    Math.min(100, Math.round(severityBase + peopleBoost + frequencyBoost + vulnerabilityBoost + safetyBoost)),
  );

  const riskRationale = [
    `Severity signal: ${structured.severityLabel} (${severityBase}%)`,
    people > 0 ? `Affected population ${people.toLocaleString("en-IN")} (+${peopleBoost})` : "Affected population not entered (+0)",
    `Frequency ${(input.frequency ?? "not set").replace(/_/g, " ")} (+${frequencyBoost})`,
    `Vulnerable groups weighting (+${vulnerabilityBoost})`,
    safetyBoost ? `Safety keywords detected (+${safetyBoost})` : "No explicit safety keywords (+0)",
  ];

  const keywords = Array.from(new Set(tokenize(lower))).slice(0, 6);
  const description = [
    `${structured.category} — ${structured.subcategory}: ${structured.issues.join(", ").toLowerCase()}.`,
    `Primarily affects ${structured.affectedGroup.toLowerCase()}${people > 0 ? ` (about ${people.toLocaleString("en-IN")} people)` : ""}.`,
    `Left unresolved, the likely consequences are: ${impacts.slice(0, 2).join("; ").toLowerCase()}.`,
    keywords.length ? `Signals used: ${keywords.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const missedRisks = MISSED_RISKS.filter((r) => r.when(lower))
    .map((r) => r.risk)
    .slice(0, 4);

  return {
    impacts,
    riskPercent,
    riskRationale,
    description,
    missedRisks,
    category: structured.category,
    subcategory: structured.subcategory,
    confidence: structured.confidence,
  };
}

/** Risk percentage (0-100) mapped onto the existing 1-5 severity column. */
export function riskPercentToSeverity(riskPercent: number): number {
  const clamped = Math.max(0, Math.min(100, riskPercent));
  return Math.min(5, Math.max(1, Math.ceil(clamped / 20) || 1));
}

/** Existing severity (1-5) rendered as a risk percentage for saved records. */
export function severityToRiskPercent(severity: number): number {
  return Math.max(0, Math.min(100, Math.round(((severity - 0.5) / 5) * 100)));
}
