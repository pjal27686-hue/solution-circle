/**
 * Generates sql/02_seed_demo.sql for the external Supabase backend from the
 * same demo dataset the preview uses, so both stay in sync.
 *
 *   bun scripts/gen-supabase-seed.ts /mnt/documents/sih-backend/sql/02_seed_demo.sql
 */
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

const q = (v: unknown): string => {
  if (v === undefined || v === null || v === "") return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return `'${String(v).replace(/'/g, "''")}'`;
};
const arr = (v: string[] | undefined): string =>
  v && v.length ? `array[${v.map((s) => q(s)).join(", ")}]::text[]` : "'{}'::text[]";
const json = (v: unknown): string => (v === undefined ? "null" : `${q(JSON.stringify(v))}::jsonb`);
const ts = (v: string | undefined): string => (v ? q(v) : "null");

const out: string[] = [];
const w = (s = "") => out.push(s);

w("-- =============================================================================");
w("-- DEMONSTRATION DATA — every row has demo = true. Delete with:");
w("--   select public.purge_demo_data();");
w("-- Generated from src/data/demo.ts (scripts/gen-supabase-seed.ts). Do not hand-edit.");
w("-- =============================================================================");
w("begin;");
w();

/* -------------------------------- reference -------------------------------- */
w("-- departments");
for (const d of demoDepartments) {
  w(
    `insert into public.departments (id, name, state, open_challenges, demo) values (${q(d.id)}, ${q(d.name)}, ${q(d.state)}, ${d.openChallenges}, true) on conflict (id) do nothing;`,
  );
}
w();
w("-- universities");
for (const u of demoUniversities) {
  w(
    `insert into public.universities (id, name, district, state, verified, student_count, demo) values (${q(u.id)}, ${q(u.name)}, ${q(u.district)}, ${q(u.state)}, ${q(u.verified)}, ${u.studentCount}, true) on conflict (id) do nothing;`,
  );
}
w();
w("-- organizations");
for (const o of demoOrganizations) {
  w(
    `insert into public.organizations (id, name, sector, type, district, state, team_size, domains, past_projects, verified, trust_score, demo) values (${q(o.id)}, ${q(o.name)}, ${q(o.sector)}, ${q(o.type)}, ${q(o.district)}, ${q(o.state)}, ${o.teamSize}, ${arr(o.domains)}, ${o.pastProjects}, ${q(o.verified)}, ${o.trustScore}, true) on conflict (id) do nothing;`,
  );
  for (const s of o.skills) {
    w(
      `insert into public.organization_skills (organization_id, skill) values (${q(o.id)}, ${q(s)}) on conflict do nothing;`,
    );
  }
}
w();

const categories = Array.from(new Set(demoReports.map((r) => `${r.category}||${r.subcategory}`)));
w("-- problem categories");
categories.forEach((c, i) => {
  const [name, sub] = c.split("||");
  w(
    `insert into public.problem_categories (id, name, subcategory) values (${q(`CAT-${String(i + 1).padStart(3, "0")}`)}, ${q(name)}, ${q(sub)}) on conflict (id) do nothing;`,
  );
});
w();

/* --------------------------------- people ---------------------------------- */
w("-- profiles + roles (roles are stored in their own table)");
for (const u of demoUsers) {
  w(
    `insert into public.profiles (id, name, email, district, state, department_id, university_id, organization_id, trust_score, verified, demo) values (${q(u.id)}, ${q(u.name)}, ${q(u.email)}, ${q(u.district)}, ${q(u.state)}, ${q(u.departmentId)}, ${q(u.universityId)}, ${q(u.organizationId)}, ${q(u.trustScore)}, ${q(u.verified)}, true) on conflict (id) do nothing;`,
  );
  w(
    `insert into public.user_roles (profile_id, role) values (${q(u.id)}, ${q(u.role)}::public.app_role) on conflict do nothing;`,
  );
}
w();
w("-- students / officers");
const students = demoUsers.filter((u) => u.role === "student");
students.forEach((s, i) => {
  w(
    `insert into public.students (id, profile_id, university_id, branch, year, demo) values (${q(`STU-${String(i + 1).padStart(3, "0")}`)}, ${q(s.id)}, ${q(s.universityId)}, 'Civil Engineering', 3, true) on conflict (id) do nothing;`,
  );
});
demoUsers
  .filter((u) => u.role === "officer" || u.role === "gov_admin")
  .forEach((o, i) => {
    w(
      `insert into public.government_officers (id, profile_id, department_id, designation, jurisdiction, demo) values (${q(`OFF-${String(i + 1).padStart(3, "0")}`)}, ${q(o.id)}, ${q(o.departmentId)}, ${q(o.role === "officer" ? "Junior Engineer" : "Deputy Commissioner")}, ${q(o.district)}, true) on conflict (id) do nothing;`,
    );
  });
w();
w("-- teams");
for (const t of demoTeams) {
  w(
    `insert into public.teams (id, name, university_id, organization_id, district, state, member_names, skills, domains, capacity, completed_projects, on_time_rate, trust_score, verified, demo) values (${q(t.id)}, ${q(t.name)}, ${q(t.universityId)}, ${q(t.organizationId)}, ${q(t.district)}, ${q(t.state)}, ${arr(t.memberNames)}, ${arr(t.skills)}, ${arr(t.domains)}, ${t.capacity}, ${t.completedProjects}, ${t.onTimeRate}, ${t.trustScore}, ${q(t.verified)}, true) on conflict (id) do nothing;`,
  );
  for (const m of t.memberIds) {
    w(
      `insert into public.team_members (team_id, profile_id, role_in_team) values (${q(t.id)}, ${q(m)}, 'lead') on conflict do nothing;`,
    );
  }
  w(
    `insert into public.trust_scores (subject_type, subject_id, score) values ('team', ${q(t.id)}, ${t.trustScore}) on conflict (subject_type, subject_id) do nothing;`,
  );
}
w();

/* --------------------------------- reports --------------------------------- */
w("-- citizen reports + locations");
for (const r of demoReports) {
  w(
    `insert into public.citizen_reports (id, title, description, category, subcategory, severity, affected_people, frequency, vulnerability, evidence_count, status, reporter_id, reporter_name, rejection_reason, structured, demo, created_at, updated_at) values (${q(r.id)}, ${q(r.title)}, ${q(r.description)}, ${q(r.category)}, ${q(r.subcategory)}, ${r.severity}, ${r.affectedPeople}, ${q(r.frequency)}::public.report_frequency, ${r.vulnerability}, ${r.evidenceCount}, ${q(r.status)}::public.report_status, ${q(r.reporterId?.startsWith("USR-") ? r.reporterId : undefined)}, ${q(r.reporterName)}, ${q(r.rejectionReason)}, ${json(r.structured)}, true, ${ts(r.createdAt)}, ${ts(r.updatedAt)}) on conflict (id) do nothing;`,
  );
  w(
    `insert into public.report_locations (report_id, locality, district, state, lat, lng) values (${q(r.id)}, ${q(r.locality)}, ${q(r.district)}, ${q(r.state)}, ${q(r.lat)}, ${q(r.lng)}) on conflict (report_id) do nothing;`,
  );
  for (let i = 0; i < r.evidenceCount; i += 1) {
    const id = `REV-${r.id.replace("RPT-", "")}-${i + 1}`;
    w(
      `insert into public.report_evidence (id, report_id, kind, label, storage_key, mime_type, size_kb, owner_id, owner_name, verification_state, demo, created_at) values (${q(id)}, ${q(r.id)}, 'image', ${q(`Citizen photo ${i + 1}`)}, ${q(`reports/${r.id}/photo-${i + 1}.jpg`)}, 'image/jpeg', ${420 + i * 130}, ${q(r.reporterId?.startsWith("USR-") ? r.reporterId : undefined)}, ${q(r.reporterName)}, ${q(r.status === "submitted" ? "pending" : "verified")}::public.verification_state, true, ${ts(r.createdAt)}) on conflict (id) do nothing;`,
    );
  }
}
w();

/* -------------------------------- clusters --------------------------------- */
const clusters = clusterReports(demoReports);
w("-- problem clusters (produced by the clustering engine, priority by the weighted model)");
for (const c of clusters) {
  w(
    `insert into public.problem_clusters (id, title, category, district, state, affected_people, evidence_count, geographic_spread, trend, priority_score, priority_breakdown, status, demo, created_at) values (${q(c.id)}, ${q(c.title)}, ${q(c.category)}, ${q(c.district)}, ${q(c.state)}, ${c.affectedPeople}, ${c.evidenceCount}, ${q(c.geographicSpread)}, ${q(c.trend)}, ${c.priorityScore}, ${json(c.priorityBreakdown)}, ${q(c.status)}::public.cluster_status, true, ${ts(c.createdAt)}) on conflict (id) do nothing;`,
  );
  for (const rid of c.reportIds) {
    w(
      `insert into public.cluster_members (cluster_id, report_id) values (${q(c.id)}, ${q(rid)}) on conflict do nothing;`,
    );
    w(`update public.citizen_reports set cluster_id = ${q(c.id)} where id = ${q(rid)};`);
  }
}
w();

/* ------------------------------- challenges -------------------------------- */
w("-- challenges");
for (const c of demoChallenges) {
  const cluster = clusters.find((x) => x.id === c.clusterId);
  const score =
    cluster?.priorityScore ??
    computePriority({
      severity: 4,
      affectedPeople: c.affectedPeople,
      urgencyDays: 30,
      evidenceCount: 4,
      recurrenceCount: 3,
      vulnerability: 3,
    }).score;
  w(
    `insert into public.challenges (id, code, title, problem_statement, background, cluster_id, district, state, department_id, category, expected_solution, constraints, budget, timeline_weeks, success_metrics, evaluation_criteria, evidence_requirements, status, priority_score, affected_people, created_by, demo, created_at, deadline) values (${q(c.id)}, ${q(c.code)}, ${q(c.title)}, ${q(c.problemStatement)}, ${q(c.background)}, ${q(cluster ? c.clusterId : undefined)}, ${q(c.district)}, ${q(c.state)}, ${q(c.departmentId)}, ${q(c.category)}, ${q(c.expectedSolution)}, ${arr(c.constraints)}, ${q(c.budget)}, ${c.timelineWeeks}, ${arr(c.successMetrics)}, ${arr(c.evaluationCriteria)}, ${arr(c.evidenceRequirements)}, ${q(c.status)}::public.challenge_status, ${score}, ${c.affectedPeople}, 'USR-005', true, ${ts(c.createdAt)}, ${ts(c.deadline)}) on conflict (id) do nothing;`,
  );
  for (const s of c.requiredSkills) {
    w(
      `insert into public.challenge_skills (challenge_id, skill) values (${q(c.id)}, ${q(s)}) on conflict do nothing;`,
    );
  }
  for (const t of demoTeams) {
    const m = matchTeamToChallenge(c, t);
    w(
      `insert into public.match_scores (challenge_id, team_id, score, factors) values (${q(c.id)}, ${q(t.id)}, ${m.score}, ${json(m.factors)}) on conflict (challenge_id, team_id) do nothing;`,
    );
  }
}
w();

/* ------------------------ applications and proposals ----------------------- */
w("-- applications + proposals");
for (const a of demoApplications) {
  const challenge = demoChallenges.find((c) => c.id === a.challengeId);
  const team = demoTeams.find((t) => t.id === a.teamId);
  const score = challenge && team ? matchTeamToChallenge(challenge, team).score : 0;
  w(
    `insert into public.applications (id, challenge_id, team_id, team_name, status, match_score, evaluation_notes, demo, submitted_at) values (${q(a.id)}, ${q(a.challengeId)}, ${q(a.teamId)}, ${q(a.teamName)}, ${q(a.status)}::public.application_status, ${score}, ${q(a.evaluationNotes)}, true, ${ts(a.submittedAt)}) on conflict (id) do nothing;`,
  );
  w(
    `insert into public.proposals (application_id, approach, timeline_weeks, budget, deliverables, risks) values (${q(a.id)}, ${q(a.proposal.approach)}, ${a.proposal.timelineWeeks}, ${q(a.proposal.budget)}, ${arr(a.proposal.deliverables)}, ${arr(a.proposal.risks)}) on conflict (application_id) do nothing;`,
  );
}
w();

/* --------------------------------- projects -------------------------------- */
w("-- projects, milestones, tasks, updates");
for (const p of demoProjects) {
  w(
    `insert into public.projects (id, code, challenge_id, team_id, team_name, officer_id, officer_name, university_id, mentor_organization_id, status, progress, started_at, due_at, demo) values (${q(p.id)}, ${q(p.code)}, ${q(p.challengeId)}, ${q(p.teamId)}, ${q(p.teamName)}, ${q(p.officerId)}, ${q(p.officerName)}, ${q(p.universityId)}, ${q(p.mentorOrganizationId)}, ${q(p.status)}::public.project_status, ${p.progress}, ${ts(p.startedAt)}, ${ts(p.dueAt)}, true) on conflict (id) do nothing;`,
  );
  p.milestones.forEach((m, i) => {
    w(
      `insert into public.project_milestones (id, project_id, title, due_date, status, progress, position) values (${q(m.id)}, ${q(p.id)}, ${q(m.title)}, ${ts(m.dueDate)}, ${q(m.status)}::public.milestone_status, ${m.progress}, ${i}) on conflict (id) do nothing;`,
    );
  });
  p.tasks.forEach((t, i) => {
    w(
      `insert into public.project_tasks (id, project_id, title, assignee, status, position) values (${q(t.id)}, ${q(p.id)}, ${q(t.title)}, ${q(t.assignee)}, ${q(t.status)}::public.task_status, ${i}) on conflict (id) do nothing;`,
    );
  });
  for (const u of p.updates) {
    w(
      `insert into public.project_updates (id, project_id, author, body, created_at) values (${q(u.id)}, ${q(p.id)}, ${q(u.author)}, ${q(u.body)}, ${ts(u.createdAt)}) on conflict (id) do nothing;`,
    );
  }
}
w();
w("-- project evidence (metadata + storage key only)");
for (const e of demoEvidence) {
  w(
    `insert into public.project_evidence (id, project_id, kind, label, storage_key, mime_type, size_kb, owner_id, owner_name, verification_state, demo, created_at) values (${q(e.id)}, ${q(e.projectId)}, ${q(e.kind)}::public.evidence_kind, ${q(e.label)}, ${q(e.storageKey)}, ${q(e.kind === "document" || e.kind === "report" ? "application/pdf" : "image/jpeg")}, ${e.sizeKb}, ${q(e.ownerId?.startsWith("USR-") ? e.ownerId : undefined)}, ${q(e.ownerName)}, ${q(e.verificationState)}::public.verification_state, true, ${ts(e.createdAt)}) on conflict (id) do nothing;`,
  );
  if (e.verificationState !== "pending") {
    w(
      `insert into public.verifications (entity_type, entity_id, decision, reason, verified_by, verifier_name) values ('evidence', ${q(e.id)}, ${q(e.verificationState)}, 'Field check by ward officer', 'USR-005', 'Officer P. Rane');`,
    );
  }
}
w();

/* ---------------------------- impact + audit log --------------------------- */
w("-- impact metrics (inputs -> intervention -> output -> outcome -> impact)");
for (const p of demoProjects) {
  const challenge = demoChallenges.find((c) => c.id === p.challengeId);
  const people = challenge?.affectedPeople ?? 0;
  const rows: [string, string, number, string, string][] = [
    ["input", "Budget sanctioned (INR lakh)", 10, "lakh", "Challenge budget field"],
    ["input", "Team members deployed", 4, "people", "Team roster size"],
    ["intervention", "Milestones completed", p.milestones.filter((m) => m.status === "approved").length, "count", "Approved milestones"],
    ["output", "Evidence artefacts verified", 2, "count", "Verified project evidence rows"],
    ["outcome", "People served", people, "people", "Affected population of the source cluster"],
    ["impact", "Recurrence reduction", 38, "percent", "Reports on same locality after resolution vs before"],
  ];
  for (const [stage, metric, value, unit, method] of rows) {
    w(
      `insert into public.impact_metrics (project_id, cluster_id, stage, metric, value, unit, method, demo) values (${q(p.id)}, ${q(challenge?.clusterId)}, ${q(stage)}, ${q(metric)}, ${value}, ${q(unit)}, ${q(method)}, true);`,
    );
  }
}
w();
w("-- audit log");
for (const l of demoAuditLogs) {
  w(
    `insert into public.audit_logs (id, actor_id, actor_name, actor_role, action, entity_type, entity_id, detail, created_at) values (${q(l.id)}, ${q(l.actorId)}, ${q(l.actorName)}, ${q(l.actorRole)}::public.app_role, ${q(l.action)}, ${q(l.entityType)}, ${q(l.entityId)}, ${q(l.detail)}, ${ts(l.createdAt)}) on conflict (id) do nothing;`,
  );
}
w();
w("commit;");
w();
w(`-- Remove every demonstration row (production rows have demo = false).
create or replace function public.purge_demo_data() returns void language plpgsql as $$
begin
  delete from public.impact_metrics where demo;
  delete from public.project_evidence where demo;
  delete from public.projects where demo;
  delete from public.applications where demo;
  delete from public.challenges where demo;
  delete from public.problem_clusters where demo;
  delete from public.citizen_reports where demo;
  delete from public.teams where demo;
  delete from public.profiles where demo;
  delete from public.organizations where demo;
  delete from public.universities where demo;
  delete from public.departments where demo;
  delete from public.audit_logs where actor_id like 'USR-%';
end $$;`);

const target = process.argv[2] ?? "/mnt/documents/sih-backend/sql/02_seed_demo.sql";
await Bun.write(target, out.join("\n"));
console.log(`wrote ${target} (${out.length} lines)`);
