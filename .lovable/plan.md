# CivicBridge — SIH 2026 Platform (Phase 1 build)

A civic problem-solving platform that carries a citizen complaint through structuring, verification, clustering, priority scoring, challenge creation, capability matching, proposals, allocation, project execution, evidence, government verification and public impact.

## What this first build delivers

Every stage of the lifecycle exists and is clickable end to end, with a real typed service layer and seeded demo data (realistic Indian districts and civic issues). Depth per screen is deliberately moderate so the whole demo flow works.

- Public: landing page, how-it-works, explore challenges, public transparency dashboard, impact dashboard
- Citizen: register/login (mock session), multi-step report form with AI-style structuring preview and duplicate warnings, my reports, report timeline
- Government officer: review queue, verify/reject/request-evidence, merge duplicates, cluster view with priority breakdown, challenge creation, completion verification
- Student: dashboard with recommended challenges + match score explanation, applications, proposals, active project, milestones, evidence upload
- University coordinator: students, teams, verification, project tracking
- Industry/NGO: org profile, browse challenges, mentorship, project tracking
- Project workspace: overview, team, milestones, tasks, evidence, updates, activity log
- Admin: users, roles, clusters, challenges, verification, audit logs, analytics, settings
- Every async view has loading, empty and error states; tables become cards on mobile

## Design direction: government-official

Deep navy surfaces with ashoka-blue primary and restrained saffron accent, formal serif headings over a clean sans body, dense data tables, badge-driven status language, minimal animation. All colors as oklch semantic tokens in `src/styles.css` — no hardcoded color utilities.

## Backend (Cloudflare, in-repo)

Per your answer: the running app uses a mock service layer, and the real backend lives in the repo as Cloudflare Workers code you can deploy from GitHub.

- `backend/database/schema.sql` — full D1/SQLite schema: users, profiles, roles, user_roles, citizen_reports, report_evidence, report_locations, problem_categories, problem_clusters, cluster_members, departments, government_officers, universities, students, student_skills, organizations, organization_skills, challenges, challenge_skills, applications, proposals, teams, team_members, projects, project_milestones, project_tasks, project_evidence, project_updates, verifications, impact_metrics, notifications, messages, audit_logs, trust_scores, match_scores — with PKs, FKs, indexes, timestamps, status fields, soft delete
- `backend/database/seed.sql` — demo data mirroring the frontend fixtures
- `backend/routes/` — Worker routes matching the REST contract (`/api/auth/*`, `/api/problems`, `/api/clusters`, `/api/challenges`, `/api/applications`, `/api/projects`, `/api/matches`, `/api/impact`, `/api/analytics`, `/api/admin/audit-logs`)
- `backend/algorithms/` — the five engines as pure, testable functions: structuring, duplicate detection (token/geo similarity, no paid vector DB), clustering, explainable priority score, capability matching
- `backend/middleware/` — auth, server-side role authorization, rate-limit hook, audit logging; `backend/validators/` — Zod schemas
- `backend/workers/` — Worker entry with D1/R2/KV bindings, `wrangler.toml`, R2 upload/signed-key handling
- Web APIs only, no Node-only APIs, no hardcoded localhost

## Frontend architecture

- Routes under `src/routes/` (TanStack Router file routes; the router in this template replaces React Router — same routing outcome, one route file per page)
- `src/services/` — one client per domain, all reads through TanStack Query; a single `apiClient` reads `VITE_API_BASE_URL` and falls back to the in-memory mock adapter, so flipping to the deployed Worker is a config change
- `src/lib/engines/` — the same five engine functions the Worker uses, shared so the demo shows real computed scores, not fake numbers
- `src/types/`, `src/hooks/`, `src/components/` (shell, sidebar per role, data table, status badge, timeline, stat card, charts), role-guarded layouts
- Mock auth stores the session client-side and is clearly marked prototype auth; role checks are duplicated in the Worker middleware as the real boundary

## Honesty rules applied

The intelligence layer uses explainable open-source-style heuristics, labelled as such — no paid AI API, no fake AI claims. Demo data is labelled demo. Prototype-only actions are visibly marked instead of showing fake success toasts.

## Suggested follow-ups after this build

Deeper government review workflows, real Cloudflare deployment wiring and D1 migration run, messaging/notifications, richer maps.
