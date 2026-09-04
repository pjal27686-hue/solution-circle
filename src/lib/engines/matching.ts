import type { Challenge, MatchFactor, MatchResult, Team } from "@/types";

const WEIGHTS = {
  skills: 0.35,
  domain: 0.2,
  location: 0.15,
  capacity: 0.12,
  experience: 0.1,
  performance: 0.08,
} as const;

function coverage(required: string[], available: string[]): { score: number; matched: string[] } {
  const lower = available.map((s) => s.toLowerCase());
  const matched = required.filter((r) => lower.some((a) => a.includes(r.toLowerCase()) || r.toLowerCase().includes(a)));
  return { score: required.length ? matched.length / required.length : 0.5, matched };
}

/** Capability Matching Engine — explainable weighted capability match. */
export function matchTeamToChallenge(challenge: Challenge, team: Team): MatchResult {
  const skills = coverage(challenge.requiredSkills, team.skills);
  const domainScore = team.domains.some((d) => d.toLowerCase() === challenge.category.toLowerCase()) ? 1 : 0.35;
  const locationScore =
    team.district === challenge.district ? 1 : team.state === challenge.state ? 0.6 : 0.25;
  const capacityScore = Math.min(1, team.capacity / 5);
  const experienceScore = Math.min(1, team.completedProjects / 6);
  const performanceScore = Math.min(1, team.onTimeRate / 100);

  const factors: MatchFactor[] = [
    {
      label: "Skill match",
      weight: WEIGHTS.skills,
      score: skills.score,
      detail: skills.matched.length
        ? `Covers ${skills.matched.join(", ")}`
        : "No required skill declared by this team",
    },
    {
      label: "Domain match",
      weight: WEIGHTS.domain,
      score: domainScore,
      detail: domainScore === 1 ? `Works in ${challenge.category}` : "Adjacent domain experience only",
    },
    {
      label: "Location match",
      weight: WEIGHTS.location,
      score: locationScore,
      detail:
        locationScore === 1
          ? `Based in ${challenge.district}`
          : locationScore === 0.6
            ? `Within ${challenge.state}`
            : "Outside the state",
    },
    {
      label: "Team capacity",
      weight: WEIGHTS.capacity,
      score: capacityScore,
      detail: `${team.capacity} members available`,
    },
    {
      label: "Experience",
      weight: WEIGHTS.experience,
      score: experienceScore,
      detail: `${team.completedProjects} completed civic projects`,
    },
    {
      label: "Past performance",
      weight: WEIGHTS.performance,
      score: performanceScore,
      detail: `${team.onTimeRate}% milestones on time`,
    },
  ];

  const score = Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0) * 100);

  return { teamId: team.id, teamName: team.name, challengeId: challenge.id, score, factors };
}

export function rankTeams(challenge: Challenge, teams: Team[], limit = 5): MatchResult[] {
  return teams
    .map((t) => matchTeamToChallenge(challenge, t))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
