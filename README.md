# Civic Impact Hub

SIH 2026 — MASTER LOVABLE BUILD PROMPT

You are building a complete production-quality web application for a Smart India Hackathon (SIH) 2026 project.

1. CORE REQUIREMENT

Build a complete, modern, scalable civic problem-solving platform that connects:

Citizens

Students / Universities

Industry / NGOs

Government departments

Administrators

The platform must transform citizen problems into structured, verified, clustered, prioritized and actionable challenges, then connect suitable students/organizations with those challenges and track the complete lifecycle until resolution and measurable public impact.

This is NOT a simple CRUD website.

The platform must demonstrate intelligent workflows:

Citizen Problem → AI Structuring → Verification → Duplicate Detection → Problem Clustering → Priority Scoring → Challenge Creation → Student/Industry Matching → Proposal → Evaluation → Allocation → Execution → Evidence → Government Verification → Resolution → Impact Measurement → Public Transparency

2. NON-NEGOTIABLE BUDGET REQUIREMENT

The entire project must be designed for a $0 budget.

Do NOT introduce paid services or paid APIs.

Avoid:

OpenAI paid API

Claude paid API

AWS

Firebase paid services

Twilio

Paid email/SMS APIs

Paid analytics platforms

Paid vector databases

Paid hosting

Paid database hosting

Kubernetes

Any service that requires payment for the MVP

Prefer free/open-source technologies and Cloudflare free-tier services.

3. REQUIRED TECHNOLOGY ARCHITECTURE

Frontend

Use:

React

TypeScript

Vite

Tailwind CSS

shadcn/ui

React Router

TanStack Query

Lucide icons

Responsive design

The UI must be professional enough for an SIH final demonstration.

Do NOT create a generic template-looking dashboard.

4. CLOUD DEPLOYMENT ARCHITECTURE

The final architecture must be compatible with:

Lovable → GitHub → Cloudflare

Frontend:

Cloudflare Pages

Backend:

Cloudflare Workers

Database:

Cloudflare D1

File/evidence storage:

Cloudflare R2

Caching/session-related lightweight data:

Cloudflare KV

Real-time coordination/state:

Cloudflare Durable Objects where required

Background processing:

Cloudflare Queues where available

AI/NLP:

Use free/local/open-source approaches wherever possible.

The application must not depend on a paid external API to function.

Keep the architecture modular so AI providers can be replaced later.

5. IMPORTANT LOVABLE REQUIREMENT

Build the application so that frontend and backend are clearly separated.

Do NOT put important business logic only inside React components.

Create a clean service/API layer.

Frontend communicates with backend through REST-style API endpoints.

Example structure:

src/
components/
pages/
layouts/
hooks/
services/
types/
lib/
utils/

backend/
routes/
services/
middleware/
validators/
algorithms/
database/
workers/

Keep the architecture easy to migrate/export and deploy through GitHub + Cloudflare.

6. USER ROLES

Implement role-based access control.

Roles:

Citizen

Student

University Coordinator

Industry / NGO

Government Officer

Government Administrator

Platform Administrator

Super Admin

Every role must see only the pages and actions appropriate to that role.

7. CITIZEN MODULE

Create a citizen-facing portal.

Citizen pages

Landing Page

Include:

Platform purpose

How it works

Key statistics

Active challenges

Recently resolved problems

Public impact

CTA to report a problem

CTA to explore challenges

Citizen Registration/Login

Include:

Email authentication

Role selection where appropriate

Profile creation

Never expose passwords or sensitive information.

Report Problem

Create a high-quality multi-step form.

Fields:

Problem title

Description

Category

Subcategory

Location

District

State

Optional coordinates

Photos

Documents/evidence

Severity

Number of people affected

Frequency

Existing government service if known

Optional contact information

Add:

"Describe your problem in your own words."

The system should help convert unstructured citizen text into structured information.

Problem Status

Citizen can track:

Submitted

Under Review

Verified

Clustered

Converted to Challenge

Assigned

In Progress

Government Verification

Resolved

Rejected

Show a visual timeline.

My Reports

Show:

Report ID

Title

Location

Status

Date

Verification status

Impact

8. AI / INTELLIGENCE LAYER

The platform must have an intelligence layer.

Do NOT make fake AI claims.

Implement the architecture so intelligence functions can work with free/open-source methods.

Functions:

A. Problem Structuring

Convert:

"Road is broken near our school and during rain water stays there"

into structured information such as:

Category: Infrastructure

Subcategory: Road

Issue: Road damage + waterlogging

Location: School area

Severity: High

Affected group: Students/residents

B. Duplicate Detection

When a new problem is submitted:

Compare it with existing problems.

Determine:

Exact duplicate

Highly similar

Related

New

Show:

"Similar problems found near this location."

Do NOT automatically delete reports.

Instead, allow authorized users to review and merge them.

C. Problem Clustering

Group related citizen reports.

Example:

100 citizen reports:

"Road damaged"

"Road full of potholes"

"Road dangerous during rain"

"Vehicles falling due to potholes"

can become:

Cluster: Road Infrastructure Failure — Area X

Display:

Number of reports

Number of affected people

Geographic spread

Severity

Evidence count

Trend

D. Priority Score

Create a transparent scoring algorithm.

Example conceptual model:

Priority Score =

Severity × 0.30
+
Affected Population × 0.25
+
Urgency × 0.20
+
Evidence Strength × 0.10
+
Recurrence × 0.10
+
Equity / Vulnerability × 0.05

Normalize the values.

Show the reason behind the score.

Never present an unexplained AI score.

E. Matching Engine

Match challenges with:

Students

Universities

Industry

NGOs

Consider:

Skills

Domain

Location

Technology

Experience

Availability

Team capacity

Previous performance

Return:

Match Score: 87%

and explain:

Skill match

Domain match

Location match

Capacity match

9. GOVERNMENT MODULE

Create a government dashboard.

Government Dashboard

Show:

Total reported problems

Verified problems

Active clusters

Critical problems

Active challenges

Assigned challenges

Problems awaiting verification

Resolution rate

Average resolution time

Geographic distribution

Department workload

Public impact

Include charts and maps where practical.

10. GOVERNMENT PROBLEM REVIEW

Government officer can:

View reports

Verify reports

Reject with reason

Request more evidence

Merge duplicates

Assign department

Change priority

Create official challenge

Track execution

Verify completion

Every important action must create an audit log.

11. CHALLENGE CREATION

Verified problem clusters can become official challenges.

Challenge fields:

Challenge ID

Title

Problem statement

Background

Location

Department

Category

Expected solution

Constraints

Required skills

Budget requirement

Timeline

Success metrics

Evaluation criteria

Evidence requirements

Status

Challenge lifecycle:

Draft
→ Published
→ Applications Open
→ Evaluation
→ Selected
→ Allocated
→ In Progress
→ Submitted
→ Government Verification
→ Completed

12. STUDENT DASHBOARD

Create a student portal.

Pages:

Student Dashboard

Profile

Skills

Projects

Browse Challenges

Recommended Challenges

Applications

Proposals

Active Projects

Milestones

Evidence Upload

Messages/Collaboration

Achievements

Impact

Dashboard should show:

Recommended challenges

Match score

Active applications

Active projects

Upcoming deadlines

Completed projects

Impact generated

13. UNIVERSITY DASHBOARD

University coordinator can see:

Students

Teams

Skills

Challenges

Applications

Projects

Performance

Impact

Department participation

Allow university coordinator to:

Create/manage teams

Verify students

Approve participation

Track projects

14. INDUSTRY / NGO DASHBOARD

Create an organization dashboard.

Organization profile:

Organization name

Sector

Skills

Domains

Location

Team size

Expertise

Past projects

Features:

Browse challenges

Recommend solutions

Partner with student teams

Mentor projects

Offer technical support

Track projects

View impact

15. COLLABORATION WORKSPACE

For accepted projects create a workspace.

Include:

Project overview

Team members

Government officer

University coordinator

Industry mentor

Milestones

Tasks

Progress

Evidence

Comments

Updates

Activity log

Project lifecycle should be visible.

16. CLAIM / ALLOCATION SYSTEM

Create a controlled allocation workflow.

A challenge cannot simply be claimed by everyone.

Workflow:

Challenge Published
→ Application
→ Proposal
→ Evaluation
→ Shortlist
→ Selection
→ Allocation
→ Acceptance
→ Project Started

Prevent conflicting allocations.

Use a clear state machine.

Possible states:

DRAFT
PUBLISHED
APPLICATION_OPEN
UNDER_EVALUATION
SHORTLISTED
SELECTED
ALLOCATED
ACCEPTED
IN_PROGRESS
SUBMITTED
VERIFICATION
COMPLETED
REJECTED
CANCELLED

Invalid state transitions must be blocked by backend validation.

17. TRUST / REPUTATION SYSTEM

Create transparent trust scoring.

Trust should consider:

Verified identity

Previous completed projects

Government verification

Evidence quality

Deadline performance

Successful outcomes

Collaboration feedback

Do NOT allow users to manipulate scores directly.

Display:

Trust Score
+
Why the score exists.

18. EVIDENCE SYSTEM

Every project should support evidence.

Evidence types:

Images

Documents

Progress reports

Before/after evidence

Government verification

Location evidence

Completion proof

Store files using Cloudflare R2-compatible architecture.

Do not store large files directly in the database.

Database stores:

File metadata

URL/key

Owner

Project

Timestamp

Verification state

19. PUBLIC TRANSPARENCY DASHBOARD

Create a public dashboard without exposing private information.

Show:

Problems reported

Problems verified

Problems resolved

Active challenges

Projects completed

People affected

District/state statistics

Resolution rate

Average resolution time

Impact generated

Create public charts.

Example:

1,240 Problems Reported
830 Verified
315 Converted to Challenges
187 Resolved
52,000+ People Impacted

Use seeded demo data initially.

Clearly structure the data so these numbers can later come from real database records.

20. IMPACT ANALYTICS

Create an Impact Dashboard.

Track:

Inputs

Problems reported

Participants

Projects

Resources

Outputs

Solutions delivered

Projects completed

Government departments engaged

Outcomes

People affected

Resolution time

Service improvement

Cost/time saved

Long-term impact

Recurring issue reduction

Citizen satisfaction

Geographic improvement

Show an impact funnel:

Problem
→ Intervention
→ Output
→ Outcome
→ Impact

21. ADMIN DASHBOARD

Create a powerful admin dashboard.

Sections:

Overview

Users

Roles

Problems

Clusters

Challenges

Applications

Projects

Departments

Universities

Organizations

Evidence

Verification

Audit Logs

Analytics

System Settings

Admin must be able to:

Suspend users

Verify organizations

Verify universities

Review reports

Manage categories

Manage challenges

Review suspicious activity

View audit logs

22. DATABASE DESIGN

Use a relational structure compatible with Cloudflare D1 / SQLite.

Create tables similar to:

users
profiles
roles
user_roles
citizen_reports
report_evidence
report_locations
problem_categories
problem_clusters
cluster_members
departments
government_officers
universities
students
student_skills
organizations
organization_skills
challenges
challenge_skills
applications
proposals
teams
team_members
projects
project_milestones
project_tasks
project_evidence
project_updates
verifications
impact_metrics
notifications
messages
audit_logs
trust_scores
match_scores

Use:

Primary keys

Foreign keys

Indexes

Timestamps

Status fields

Soft deletion where appropriate

Never put everything into one giant table.

23. SECURITY

Implement:

Authentication

Role-based authorization

Server-side validation

Input sanitization

API authorization

File upload validation

Rate limiting architecture

Audit logs

Secure environment variables

No secrets in frontend

No API keys committed to GitHub

Never trust role information sent by the frontend.

The backend must determine authorization.

24. API ARCHITECTURE

Create clean API endpoints.

Examples:

POST /api/auth/register
POST /api/auth/login
GET /api/problems
POST /api/problems
GET /api/problems/:id
PATCH /api/problems/:id
POST /api/problems/:id/verify
POST /api/problems/:id/merge

GET /api/clusters
POST /api/clusters

GET /api/challenges
POST /api/challenges
GET /api/challenges/:id
POST /api/challenges/:id/apply

GET /api/applications
POST /api/applications
PATCH /api/applications/:id

GET /api/projects
POST /api/projects
GET /api/projects/:id
PATCH /api/projects/:id

POST /api/projects/:id/milestones
POST /api/projects/:id/evidence

GET /api/matches
GET /api/impact
GET /api/analytics

GET /api/admin/audit-logs

Use consistent response structures and error handling.

25. UI / UX REQUIREMENTS

The interface must look like a serious government + technology platform.

Design principles:

Clean

Modern

Professional

Accessible

Mobile responsive

Fast

Minimal unnecessary animation

Strong information hierarchy

Clear status indicators

Excellent empty states

Excellent loading states

Excellent error states

Use cards, tables, charts, timelines, badges, filters and maps appropriately.

Do not overload every screen with cards.

26. LANDING PAGE DESIGN

Create a high-quality landing page.

Hero:

From Citizen Problems to Verified Solutions.

Supporting message:

A collaborative platform connecting citizens, government, students, universities and organizations to turn real-world problems into measurable public impact.

CTA:

Report a Problem

Secondary CTA:

Explore Challenges

Include:

How It Works
→ Report
→ Verify
→ Cluster
→ Match
→ Solve
→ Measure Impact

Then:

Live statistics

Featured challenges

Recent impact

Stakeholder sections

Transparency section

Footer

27. DEMO DATA

Create realistic seed/demo data.

Include:

Citizens

Students

Universities

Government departments

Organizations

Problems

Problem clusters

Challenges

Applications

Projects

Evidence

Impact metrics

Use realistic Indian locations and civic problems.

Examples:

Road damage

Waterlogging

Waste management

Street lighting

Public transport

Water supply

Drainage

School infrastructure

Clearly separate demo data from production data.

28. DASHBOARD VISUALIZATION

Use charts for:

Problems by category

Problems by district

Priority distribution

Resolution rate

Average resolution time

Challenge conversion

Student participation

Organization participation

Project success

Impact

Charts must use real database values once backend data is available.

29. IMPORTANT DIFFERENTIATION

The project should visually and technically emphasize these five core engines:

1. Problem Intelligence Engine

Unstructured citizen complaints → structured problems.

2. Civic Clustering Engine

Many individual complaints → one meaningful problem cluster.

3. Transparent Priority Engine

Prioritize based on explainable factors.

4. Capability Matching Engine

Match problems with people/organizations based on actual capability.

5. Impact Loop

Do not stop after assigning a project.

Track:

Problem → Solution → Verification → Outcome → Impact

These five engines are the core innovation of the project.

30. IMPORTANT: DO NOT FAKE FUNCTIONALITY

Do not create buttons that only show fake success messages.

Every major button must either:

Perform a real frontend operation

Call a real backend API

Update real database state

Or clearly be marked as a prototype/demo feature

Do not claim AI functionality that does not actually exist.

Do not create fake analytics that pretend to be live.

Seeded demo data is acceptable, but structure the system for real data.

31. ERROR / LOADING STATES

Every asynchronous operation needs:

Loading state

Success state

Error state

Empty state

Examples:

"Loading problems..."

"No problems found."

"Unable to load problems. Try again."

32. MOBILE RESPONSIVENESS

The entire application must work on:

Desktop

Laptop

Tablet

Mobile

Dashboards should transform properly on small screens.

Tables should become horizontally scrollable or card-based.

33. DEVELOPMENT PRIORITY

Build in this order:

PHASE 1
Authentication + roles + application shell

PHASE 2
Citizen problem reporting

PHASE 3
Government verification

PHASE 4
Problem clustering + priority

PHASE 5
Challenge management

PHASE 6
Student/university/organization matching

PHASE 7
Applications + proposals

PHASE 8
Project allocation + workspace

PHASE 9
Evidence + verification

PHASE 10
Impact analytics

PHASE 11
Public transparency dashboard

PHASE 12
Admin + audit system

34. CODE QUALITY

Use:

TypeScript types

Reusable components

Reusable hooks

Service layer

Validation schemas

Consistent naming

Error boundaries where appropriate

Environment variables

No duplicated business logic

Do not put huge amounts of code into one component.

35. CLOUDflare MIGRATION REQUIREMENT

Keep the application compatible with Cloudflare.

Avoid Node-only APIs in frontend/backend logic that would prevent Cloudflare Workers deployment.

Use Web APIs where possible.

Do not hard-code localhost URLs.

Use environment variables such as:

VITE_API_BASE_URL

and backend environment bindings for:

D1
R2
KV
Queues
Durable Objects

The final architecture must allow:

Lovable development
→ GitHub repository
→ Cloudflare Pages frontend
→ Cloudflare Workers backend
→ D1 database
→ R2 storage

36. FINAL OUTPUT EXPECTATION

Do not just create a landing page.

Create the actual application foundation with:

Complete navigation

Role-based dashboards

Database schema

API/service architecture

Forms

Tables

Status workflows

Matching

Priority logic

Clustering architecture

Evidence handling

Verification

Analytics

Audit logging

Responsive UI

Build the MVP so that it can be demonstrated end-to-end:

DEMO FLOW

Citizen reports a road problem.

System structures the report.

Similar reports are detected.

Reports are grouped into a cluster.

Priority score is calculated.

Government officer verifies it.

Cluster becomes a challenge.

Students see the challenge.

Matching engine recommends suitable teams.

Student submits proposal.

Government evaluates it.

Team is selected.

Project workspace is created.

Team updates milestones.

Evidence is uploaded.

Government verifies completion.

Problem becomes resolved.

Public dashboard updates.

Impact metrics are calculated.

This complete lifecycle is the most important demonstration of the application.

37. BUILD PHILOSOPHY

Think like a senior full-stack engineer and SIH product architect.

Before implementing a feature:

Understand its role in the overall workflow.

Design the data model.

Design the API.

Design authorization.

Then build the UI.

Avoid disconnected pages.

Every dashboard must connect to the same underlying workflow and data model.

The application should feel like one complete ecosystem, not several separate dashboards.

Start by creating the application architecture, database schema, routing, authentication structure, shared UI system and core citizen → government → challenge → student → project → impact workflow.

Then implement each module systematically.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9b7214f5-78bb-4118-b98f-9cbdb43dfe30).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
