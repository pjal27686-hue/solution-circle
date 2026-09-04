import type { CitizenReport } from "@/types";
import { tokenize } from "./structuring";

export type DuplicateVerdict = "exact_duplicate" | "highly_similar" | "related" | "new";

export interface DuplicateMatch {
  reportId: string;
  title: string;
  district: string;
  locality: string;
  similarity: number;
  distanceKm?: number | undefined;
  verdict: DuplicateVerdict;
  reasons: string[];
}

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (!setA.size || !setB.size) return 0;
  let inter = 0;
  setA.forEach((v) => {
    if (setB.has(v)) inter += 1;
  });
  return inter / (setA.size + setB.size - inter);
}

export function haversineKm(
  a: { lat?: number | undefined; lng?: number | undefined },
  b: { lat?: number | undefined; lng?: number | undefined },
): number | undefined {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return undefined;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Number((2 * R * Math.asin(Math.sqrt(h))).toFixed(2));
}

export interface DuplicateCandidateInput {
  title: string;
  description: string;
  category?: string | undefined;
  district?: string | undefined;
  locality?: string | undefined;
  lat?: number | undefined;
  lng?: number | undefined;
}

/** Duplicate Detection — lexical overlap + geo proximity. No vector database. */
export function findDuplicates(
  candidate: DuplicateCandidateInput,
  existing: CitizenReport[],
  limit = 5,
): DuplicateMatch[] {
  const candTokens = tokenize(`${candidate.title} ${candidate.description}`);

  const matches: DuplicateMatch[] = existing.map((report) => {
    const reasons: string[] = [];
    const textScore = jaccard(candTokens, tokenize(`${report.title} ${report.description}`));
    if (textScore > 0.2) reasons.push(`${Math.round(textScore * 100)}% wording overlap`);

    let geoScore = 0;
    const distanceKm = haversineKm(candidate, report);
    if (distanceKm != null) {
      geoScore = distanceKm <= 0.5 ? 1 : distanceKm <= 2 ? 0.7 : distanceKm <= 5 ? 0.4 : 0.1;
      reasons.push(`${distanceKm} km away`);
    } else if (candidate.locality && report.locality && candidate.locality.toLowerCase() === report.locality.toLowerCase()) {
      geoScore = 0.8;
      reasons.push("same locality");
    } else if (candidate.district && candidate.district === report.district) {
      geoScore = 0.4;
      reasons.push("same district");
    }

    const categoryScore = candidate.category && candidate.category === report.category ? 1 : 0;
    if (categoryScore) reasons.push("same category");

    const similarity = Number(
      (textScore * 0.55 + geoScore * 0.3 + categoryScore * 0.15).toFixed(3),
    );

    const verdict: DuplicateVerdict =
      similarity >= 0.8 ? "exact_duplicate" : similarity >= 0.55 ? "highly_similar" : similarity >= 0.32 ? "related" : "new";

    return {
      reportId: report.id,
      title: report.title,
      district: report.district,
      locality: report.locality,
      similarity,
      distanceKm,
      verdict,
      reasons,
    };
  });

  return matches
    .filter((m) => m.verdict !== "new")
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
