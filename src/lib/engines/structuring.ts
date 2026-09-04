import type { StructuredProblem } from "@/types";

/**
 * Problem Intelligence Engine — rule/keyword based structuring.
 * Deliberately transparent and dependency-free (no paid AI API). The same
 * function runs in the Cloudflare Worker (see backend/algorithms).
 */

const CATEGORY_RULES: {
  category: string;
  subcategory: string;
  words: string[];
}[] = [
  { category: "Infrastructure", subcategory: "Road", words: ["road", "pothole", "potholes", "street", "footpath", "highway", "tar"] },
  { category: "Water & Sanitation", subcategory: "Drainage", words: ["drain", "drainage", "sewage", "waterlogging", "waterlogged", "flood", "overflow"] },
  { category: "Water & Sanitation", subcategory: "Water Supply", words: ["water supply", "tap", "borewell", "pipeline", "drinking water"] },
  { category: "Sanitation", subcategory: "Waste Management", words: ["garbage", "waste", "dump", "trash", "litter", "dustbin"] },
  { category: "Utilities", subcategory: "Street Lighting", words: ["light", "lights", "streetlight", "lamp", "dark"] },
  { category: "Transport", subcategory: "Public Transport", words: ["bus", "transport", "auto", "stop", "shelter", "traffic"] },
  { category: "Education", subcategory: "School Infrastructure", words: ["school", "classroom", "students", "college", "toilet block"] },
  { category: "Health", subcategory: "Public Health", words: ["hospital", "clinic", "mosquito", "dengue", "disease", "phc"] },
];

const ISSUE_RULES: { issue: string; words: string[] }[] = [
  { issue: "Road damage", words: ["broken", "damaged", "pothole", "potholes", "crack"] },
  { issue: "Waterlogging", words: ["water stays", "waterlogging", "stagnant", "flood", "logged"] },
  { issue: "Service outage", words: ["not working", "no supply", "cut", "outage", "fails"] },
  { issue: "Accumulation / overflow", words: ["overflow", "piles", "heap", "dump", "spill"] },
  { issue: "Safety hazard", words: ["accident", "dangerous", "unsafe", "falling", "injury"] },
  { issue: "Recurring during rain", words: ["rain", "monsoon", "rains"] },
];

const GROUP_RULES: { group: string; words: string[] }[] = [
  { group: "School children & students", words: ["school", "students", "children", "college"] },
  { group: "Elderly & patients", words: ["elderly", "old", "patients", "hospital"] },
  { group: "Commuters", words: ["bus", "commute", "vehicles", "traffic", "auto"] },
  { group: "Residents of the locality", words: ["residents", "colony", "ward", "houses", "families"] },
];

const STOP_WORDS = new Set([
  "the", "and", "our", "near", "with", "that", "this", "there", "here", "from",
  "for", "are", "was", "were", "has", "have", "not", "but", "very", "all",
  "any", "get", "its", "his", "her", "they", "them", "than", "then", "when",
  "who", "will", "can", "also", "into", "over", "out", "because", "during",
  "please", "kindly", "sir", "madam",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function hits(text: string, words: string[]): number {
  return words.filter((w) => text.includes(w)).length;
}

export function structureProblem(input: {
  text: string;
  severity?: number;
  affectedPeople?: number;
}): StructuredProblem {
  const text = input.text.toLowerCase();

  let best = { category: "General Civic", subcategory: "Uncategorised", score: 0 };
  for (const rule of CATEGORY_RULES) {
    const score = hits(text, rule.words);
    if (score > best.score) best = { category: rule.category, subcategory: rule.subcategory, score };
  }

  const issues = ISSUE_RULES.filter((r) => hits(text, r.words) > 0).map((r) => r.issue);
  const group = GROUP_RULES.find((r) => hits(text, r.words) > 0)?.group ?? "General public";

  const severity = input.severity ?? (issues.includes("Safety hazard") ? 4 : issues.length > 2 ? 4 : 3);
  const severityLabel = severity >= 5 ? "Critical" : severity >= 4 ? "High" : severity >= 3 ? "Moderate" : "Low";

  const keywords = Array.from(new Set(tokenize(text))).slice(0, 12);
  const signals = best.score + issues.length + (group === "General public" ? 0 : 1);
  const confidence = Math.min(0.95, 0.35 + signals * 0.09);

  return {
    category: best.category,
    subcategory: best.subcategory,
    issues: issues.length ? issues : ["Unclassified civic issue"],
    severityLabel,
    affectedGroup: group,
    keywords,
    confidence: Number(confidence.toFixed(2)),
  };
}
