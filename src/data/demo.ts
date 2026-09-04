import type {
  Application,
  AuditLog,
  Challenge,
  CitizenReport,
  Department,
  Evidence,
  Organization,
  Project,
  Team,
  University,
  User,
} from "@/types";
import { structureProblem } from "@/lib/engines/structuring";

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

export const demoUsers: User[] = [
  { id: "USR-001", name: "Anita Deshmukh", email: "citizen@demo.in", role: "citizen", district: "Pune", state: "Maharashtra", verified: true, demo: true },
  { id: "USR-002", name: "Rahul Iyer", email: "student@demo.in", role: "student", district: "Pune", state: "Maharashtra", universityId: "UNI-001", trustScore: 78, verified: true, demo: true },
  { id: "USR-003", name: "Dr. S. Kulkarni", email: "university@demo.in", role: "university", district: "Pune", state: "Maharashtra", universityId: "UNI-001", verified: true, demo: true },
  { id: "USR-004", name: "GreenCivic Solutions", email: "industry@demo.in", role: "organization", district: "Pune", state: "Maharashtra", organizationId: "ORG-001", trustScore: 84, verified: true, demo: true },
  { id: "USR-005", name: "Officer P. Rane", email: "officer@demo.in", role: "officer", district: "Pune", state: "Maharashtra", departmentId: "DEP-001", verified: true, demo: true },
  { id: "USR-006", name: "Smt. R. Bhosale", email: "govadmin@demo.in", role: "gov_admin", district: "Pune", state: "Maharashtra", departmentId: "DEP-001", verified: true, demo: true },
  { id: "USR-007", name: "Platform Admin", email: "admin@demo.in", role: "platform_admin", state: "Maharashtra", verified: true, demo: true },
  { id: "USR-008", name: "Super Admin", email: "superadmin@demo.in", role: "super_admin", state: "India", verified: true, demo: true },
];

export const demoDepartments: Department[] = [
  { id: "DEP-001", name: "Public Works Department", state: "Maharashtra", openChallenges: 3, demo: true },
  { id: "DEP-002", name: "Water Supply & Sewerage Board", state: "Maharashtra", openChallenges: 2, demo: true },
  { id: "DEP-003", name: "Solid Waste Management Cell", state: "Maharashtra", openChallenges: 1, demo: true },
  { id: "DEP-004", name: "Urban Transport Authority", state: "Maharashtra", openChallenges: 1, demo: true },
  { id: "DEP-005", name: "School Education Department", state: "Maharashtra", openChallenges: 1, demo: true },
  { id: "DEP-006", name: "Municipal Electrical Wing", state: "Maharashtra", openChallenges: 1, demo: true },
];

export const demoUniversities: University[] = [
  { id: "UNI-001", name: "College of Engineering, Pune", district: "Pune", state: "Maharashtra", verified: true, studentCount: 412, demo: true },
  { id: "UNI-002", name: "VJTI Mumbai", district: "Mumbai", state: "Maharashtra", verified: true, studentCount: 305, demo: true },
  { id: "UNI-003", name: "Government Polytechnic, Nagpur", district: "Nagpur", state: "Maharashtra", verified: false, studentCount: 168, demo: true },
];

export const demoOrganizations: Organization[] = [
  { id: "ORG-001", name: "GreenCivic Solutions", sector: "Urban Infrastructure", type: "industry", district: "Pune", state: "Maharashtra", teamSize: 24, skills: ["GIS", "Civil Engineering", "IoT Sensors"], domains: ["Infrastructure", "Water & Sanitation"], pastProjects: 7, verified: true, trustScore: 84, demo: true },
  { id: "ORG-002", name: "Jal Seva Foundation", sector: "Water & Sanitation", type: "ngo", district: "Nashik", state: "Maharashtra", teamSize: 12, skills: ["Community Mobilisation", "Water Audit", "Survey"], domains: ["Water & Sanitation", "Health"], pastProjects: 11, verified: true, trustScore: 91, demo: true },
  { id: "ORG-003", name: "UrbanFlow Analytics", sector: "Data & Analytics", type: "industry", district: "Mumbai", state: "Maharashtra", teamSize: 18, skills: ["Data Science", "Dashboards", "Python"], domains: ["Transport", "Infrastructure"], pastProjects: 5, verified: true, trustScore: 76, demo: true },
  { id: "ORG-004", name: "Shiksha Sahyog Trust", sector: "Education", type: "ngo", district: "Nagpur", state: "Maharashtra", teamSize: 9, skills: ["Facility Audit", "Volunteer Management"], domains: ["Education"], pastProjects: 6, verified: false, trustScore: 68, demo: true },
];

export const demoTeams: Team[] = [
  { id: "TEA-001", name: "COEP RoadSense", universityId: "UNI-001", memberIds: ["USR-002"], memberNames: ["Rahul Iyer", "Sneha Patil", "Aman Shaikh", "Divya Rao"], skills: ["GIS", "Civil Engineering", "Mobile App", "Data Science"], domains: ["Infrastructure", "Transport"], district: "Pune", state: "Maharashtra", capacity: 4, completedProjects: 3, onTimeRate: 92, trustScore: 81, verified: true, demo: true },
  { id: "TEA-002", name: "VJTI AquaGrid", universityId: "UNI-002", memberIds: [], memberNames: ["Kiran Shetty", "Meera Joshi", "Yash Kale"], skills: ["Hydrology", "IoT Sensors", "Python"], domains: ["Water & Sanitation"], district: "Mumbai", state: "Maharashtra", capacity: 3, completedProjects: 2, onTimeRate: 85, trustScore: 74, demo: true, verified: true },
  { id: "TEA-003", name: "COEP CleanCycle", universityId: "UNI-001", memberIds: [], memberNames: ["Nikhil Jadhav", "Prachi More", "Sameer Khan", "Tanvi Sinha", "Rohit Pawar"], skills: ["Operations Research", "Route Optimisation", "Dashboards"], domains: ["Sanitation"], district: "Pune", state: "Maharashtra", capacity: 5, completedProjects: 1, onTimeRate: 78, trustScore: 66, verified: true, demo: true },
  { id: "TEA-004", name: "Jal Seva Field Unit", organizationId: "ORG-002", memberIds: [], memberNames: ["Field Team A", "Field Team B"], skills: ["Water Audit", "Survey", "Community Mobilisation"], domains: ["Water & Sanitation", "Health"], district: "Nashik", state: "Maharashtra", capacity: 6, completedProjects: 6, onTimeRate: 95, trustScore: 91, verified: true, demo: true },
  { id: "TEA-005", name: "UrbanFlow Transit Lab", organizationId: "ORG-003", memberIds: [], memberNames: ["Analytics Pod 1", "Analytics Pod 2"], skills: ["Data Science", "Dashboards", "GTFS"], domains: ["Transport"], district: "Mumbai", state: "Maharashtra", capacity: 4, completedProjects: 4, onTimeRate: 88, trustScore: 79, verified: true, demo: true },
  { id: "TEA-006", name: "Polytechnic LightWorks", universityId: "UNI-003", memberIds: [], memberNames: ["Suresh Meshram", "Ankita Gawande"], skills: ["Electrical", "IoT Sensors"], domains: ["Utilities"], district: "Nagpur", state: "Maharashtra", capacity: 2, completedProjects: 0, onTimeRate: 70, trustScore: 55, verified: false, demo: true },
];

interface RawReport {
  id: string;
  title: string;
  description: string;
  locality: string;
  district: string;
  severity: number;
  affectedPeople: number;
  evidenceCount: number;
  vulnerability: number;
  days: number;
  status: CitizenReport["status"];
  lat: number;
  lng: number;
  frequency: CitizenReport["frequency"];
  reporter?: string;
}

const rawReports: RawReport[] = [
  { id: "RPT-1001", title: "Road broken near Shivaji School", description: "The road is broken near our school and during rain water stays there for days. Students walk through dirty water every morning.", locality: "Kothrud", district: "Pune", severity: 5, affectedPeople: 4200, evidenceCount: 4, vulnerability: 5, days: 34, status: "clustered", lat: 18.507, lng: 73.807, frequency: "continuous", reporter: "USR-001" },
  { id: "RPT-1002", title: "Potholes on Kothrud main road", description: "Road full of potholes, two wheelers are falling down every week. Very dangerous during rain.", locality: "Kothrud", district: "Pune", severity: 5, affectedPeople: 6800, evidenceCount: 3, vulnerability: 4, days: 30, status: "clustered", lat: 18.509, lng: 73.81, frequency: "continuous" },
  { id: "RPT-1003", title: "Road dangerous during rains", description: "During monsoon the damaged street becomes unsafe, an accident happened last week near the school gate.", locality: "Kothrud", district: "Pune", severity: 4, affectedPeople: 2500, evidenceCount: 2, vulnerability: 4, days: 21, status: "verified", lat: 18.506, lng: 73.805, frequency: "frequent" },
  { id: "RPT-1004", title: "Drain overflow in Warje lane", description: "Sewage drain overflow near houses, stagnant water and mosquito problem for residents.", locality: "Warje", district: "Pune", severity: 4, affectedPeople: 1800, evidenceCount: 3, vulnerability: 4, days: 18, status: "verified", lat: 18.478, lng: 73.795, frequency: "frequent" },
  { id: "RPT-1005", title: "Waterlogging near Warje bus stop", description: "Waterlogging every rain, commuters cannot reach the bus stop, drainage is blocked.", locality: "Warje", district: "Pune", severity: 4, affectedPeople: 3400, evidenceCount: 2, vulnerability: 3, days: 14, status: "under_review", lat: 18.48, lng: 73.797, frequency: "occasional" },
  { id: "RPT-1006", title: "Garbage dump not cleared", description: "Garbage piles at the ward corner are not cleared for two weeks, bad smell and stray animals.", locality: "Hadapsar", district: "Pune", severity: 3, affectedPeople: 2100, evidenceCount: 2, vulnerability: 3, days: 12, status: "verified", lat: 18.5, lng: 73.94, frequency: "frequent" },
  { id: "RPT-1007", title: "Waste dumping beside the school wall", description: "Waste dump beside school wall, children play near the trash heap.", locality: "Hadapsar", district: "Pune", severity: 4, affectedPeople: 900, evidenceCount: 1, vulnerability: 5, days: 9, status: "submitted", lat: 18.502, lng: 73.943, frequency: "frequent" },
  { id: "RPT-1008", title: "Street lights not working in Sinhagad Road", description: "Streetlight poles are not working for a month, the lane is completely dark and unsafe for women.", locality: "Sinhagad Road", district: "Pune", severity: 4, affectedPeople: 5200, evidenceCount: 2, vulnerability: 4, days: 27, status: "verified", lat: 18.462, lng: 73.82, frequency: "continuous" },
  { id: "RPT-1009", title: "Dark stretch near Sinhagad chowk", description: "No lights at the chowk, accidents happen at night, lamp posts are damaged.", locality: "Sinhagad Road", district: "Pune", severity: 3, affectedPeople: 2600, evidenceCount: 1, vulnerability: 3, days: 20, status: "under_review", lat: 18.464, lng: 73.822, frequency: "continuous" },
  { id: "RPT-1010", title: "Drinking water supply irregular", description: "Tap water supply comes once in three days, pipeline leakage in the colony.", locality: "Nashik Road", district: "Nashik", severity: 4, affectedPeople: 7400, evidenceCount: 3, vulnerability: 4, days: 40, status: "converted", lat: 19.945, lng: 73.83, frequency: "continuous" },
  { id: "RPT-1011", title: "Pipeline leakage wasting water", description: "Drinking water pipeline leakage on the main road for weeks, water is wasted daily.", locality: "Nashik Road", district: "Nashik", severity: 3, affectedPeople: 3100, evidenceCount: 2, vulnerability: 3, days: 36, status: "converted", lat: 19.947, lng: 73.833, frequency: "continuous" },
  { id: "RPT-1012", title: "Bus shelter damaged", description: "The bus stop shelter is broken, no seating, passengers stand in rain and sun.", locality: "Dadar", district: "Mumbai", severity: 3, affectedPeople: 8800, evidenceCount: 2, vulnerability: 3, days: 25, status: "verified", lat: 19.019, lng: 72.844, frequency: "continuous" },
  { id: "RPT-1013", title: "No bus frequency information at stop", description: "Bus timings are not displayed, commuters wait for an hour without any information.", locality: "Dadar", district: "Mumbai", severity: 2, affectedPeople: 12000, evidenceCount: 1, vulnerability: 2, days: 22, status: "clustered", lat: 19.02, lng: 72.846, frequency: "continuous" },
  { id: "RPT-1014", title: "School toilet block unusable", description: "The school toilet block has no water supply, students avoid using it, classroom hygiene is affected.", locality: "Kamptee", district: "Nagpur", severity: 5, affectedPeople: 640, evidenceCount: 4, vulnerability: 5, days: 45, status: "in_progress", lat: 21.216, lng: 79.196, frequency: "continuous" },
  { id: "RPT-1015", title: "Classroom roof leaking", description: "Classroom roof leaks during rain, students sit on wet floor, plaster is falling.", locality: "Kamptee", district: "Nagpur", severity: 4, affectedPeople: 380, evidenceCount: 2, vulnerability: 5, days: 42, status: "in_progress", lat: 21.218, lng: 79.198, frequency: "occasional" },
  { id: "RPT-1016", title: "Drainage blocked in Nashik market", description: "Market drainage is blocked, sewage water on the road, vendors are affected daily.", locality: "Panchavati", district: "Nashik", severity: 4, affectedPeople: 4500, evidenceCount: 3, vulnerability: 3, days: 60, status: "resolved", lat: 20.01, lng: 73.79, frequency: "continuous" },
  { id: "RPT-1017", title: "Mosquito breeding due to stagnant water", description: "Stagnant water near the market causes dengue cases, health risk for residents.", locality: "Panchavati", district: "Nashik", severity: 4, affectedPeople: 3900, evidenceCount: 2, vulnerability: 4, days: 58, status: "resolved", lat: 20.012, lng: 73.792, frequency: "frequent" },
  { id: "RPT-1018", title: "Illegal parking blocking footpath", description: "Vehicles parked on footpath, pedestrians walk on the road, unsafe for elderly.", locality: "Camp", district: "Pune", severity: 2, affectedPeople: 1500, evidenceCount: 1, vulnerability: 3, days: 8, status: "rejected", lat: 18.51, lng: 73.879, frequency: "frequent" },
];

export const demoReports: CitizenReport[] = rawReports.map((r) => {
  const structured = structureProblem({ text: `${r.title}. ${r.description}`, severity: r.severity, affectedPeople: r.affectedPeople });
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: structured.category,
    subcategory: structured.subcategory,
    locality: r.locality,
    district: r.district,
    state: r.district === "Mumbai" || r.district === "Pune" || r.district === "Nashik" || r.district === "Nagpur" ? "Maharashtra" : "Maharashtra",
    lat: r.lat,
    lng: r.lng,
    severity: r.severity,
    affectedPeople: r.affectedPeople,
    frequency: r.frequency,
    vulnerability: r.vulnerability,
    evidenceCount: r.evidenceCount,
    status: r.status,
    reporterId: r.reporter ?? "USR-001",
    reporterName: r.reporter === "USR-001" || !r.reporter ? "Anita Deshmukh" : "Citizen",
    createdAt: daysAgo(r.days),
    updatedAt: daysAgo(Math.max(0, r.days - 3)),
    structured,
    ...(r.status === "rejected" ? { rejectionReason: "Enforcement matter — forwarded to traffic police, not a civic works challenge." } : {}),
    demo: true,
  };
});

export const demoChallenges: Challenge[] = [
  {
    id: "CHL-001",
    code: "PWD/PUN/2026/001",
    title: "Make Kothrud school corridor road safe and flood-free",
    problemStatement:
      "A 1.4 km stretch near Shivaji School in Kothrud has severe surface damage and retains rainwater for days, creating a daily safety and hygiene risk for approximately 4,200 students and residents.",
    background:
      "Created from a verified cluster of 3 citizen reports filed over 34 days, supported by 9 evidence items and confirmed by a ward-level site inspection.",
    clusterId: "CLS-001",
    district: "Pune",
    state: "Maharashtra",
    departmentId: "DEP-001",
    category: "Infrastructure",
    expectedSolution:
      "A costed repair and drainage design with survey data, a low-cost interim safety plan, and a monitoring dashboard for the ward engineer.",
    constraints: ["No land acquisition", "Work only outside school hours", "Budget ceiling INR 12 lakh", "Monsoon-ready within 10 weeks"],
    requiredSkills: ["GIS", "Civil Engineering", "Data Science"],
    budget: "INR 8–12 lakh (department works budget)",
    timelineWeeks: 12,
    successMetrics: ["Zero standing water after 24h of rainfall", "Road roughness index below 3000 mm/km", "No reported accidents for 6 months"],
    evaluationCriteria: ["Technical soundness (40%)", "Field feasibility (25%)", "Team capability (20%)", "Cost realism (15%)"],
    evidenceRequirements: ["Baseline survey photos", "Drainage design document", "Before/after imagery", "Ward engineer sign-off"],
    status: "IN_PROGRESS",
    priorityScore: 0,
    affectedPeople: 13500,
    createdAt: daysAgo(24),
    deadline: daysAhead(48),
    demo: true,
  },
  {
    id: "CHL-002",
    code: "WSS/NAS/2026/007",
    title: "Restore reliable drinking water supply in Nashik Road colony",
    problemStatement:
      "Households in Nashik Road receive piped water once in three days while a mainline leak wastes a significant share of supply. 10,500 residents are affected.",
    background: "Formed from a verified cluster of 2 citizen reports with metering data from the sub-division office.",
    clusterId: "CLS-004",
    district: "Nashik",
    state: "Maharashtra",
    departmentId: "DEP-002",
    category: "Water & Sanitation",
    expectedSolution: "Leak detection survey, prioritised repair plan and a supply-schedule communication mechanism for residents.",
    constraints: ["No new pipeline sanction", "Work with existing valve network"],
    requiredSkills: ["Water Audit", "Hydrology", "Survey"],
    budget: "INR 5–7 lakh",
    timelineWeeks: 10,
    successMetrics: ["Daily supply restored for 90% households", "Non-revenue water reduced by 15%"],
    evaluationCriteria: ["Method rigour (35%)", "Community engagement plan (25%)", "Team capability (25%)", "Cost realism (15%)"],
    evidenceRequirements: ["Leak survey report", "Valve map", "Household verification sample"],
    status: "UNDER_EVALUATION",
    priorityScore: 0,
    affectedPeople: 10500,
    createdAt: daysAgo(16),
    deadline: daysAhead(30),
    demo: true,
  },
  {
    id: "CHL-003",
    code: "SWM/PUN/2026/003",
    title: "Redesign ward waste collection route in Hadapsar",
    problemStatement:
      "Waste is uncollected for up to two weeks at ward corners in Hadapsar, including a dump adjacent to a school wall affecting 3,000 residents.",
    background: "Created from a verified cluster of 2 citizen reports and ward collection logs.",
    clusterId: "CLS-003",
    district: "Pune",
    state: "Maharashtra",
    departmentId: "DEP-003",
    category: "Sanitation",
    expectedSolution: "Optimised collection route, bin placement plan and a simple driver compliance tracker.",
    constraints: ["Existing vehicle fleet only", "No additional staffing"],
    requiredSkills: ["Route Optimisation", "Operations Research", "Dashboards"],
    budget: "INR 3–4 lakh",
    timelineWeeks: 8,
    successMetrics: ["Collection frequency of 6 days per week", "Zero uncollected points beyond 48 hours"],
    evaluationCriteria: ["Optimisation approach (40%)", "Implementability (30%)", "Team capability (30%)"],
    evidenceRequirements: ["Route model output", "Field validation photos", "Ward officer confirmation"],
    status: "APPLICATION_OPEN",
    priorityScore: 0,
    affectedPeople: 3000,
    createdAt: daysAgo(10),
    deadline: daysAhead(25),
    demo: true,
  },
  {
    id: "CHL-004",
    code: "MEW/PUN/2026/002",
    title: "Restore night-time lighting on Sinhagad Road stretch",
    problemStatement:
      "A 2 km stretch on Sinhagad Road has been unlit for over a month, with 7,800 residents reporting safety concerns, especially for women commuters.",
    background: "Verified cluster of 2 citizen reports plus a night-time field audit.",
    clusterId: "CLS-002",
    district: "Pune",
    state: "Maharashtra",
    departmentId: "DEP-006",
    category: "Utilities",
    expectedSolution: "Fault mapping, repair sequencing and a low-cost outage reporting flow for citizens.",
    constraints: ["Retrofit existing poles", "No new electrical sanction"],
    requiredSkills: ["Electrical", "IoT Sensors", "Mobile App"],
    budget: "INR 6 lakh",
    timelineWeeks: 9,
    successMetrics: ["95% poles functional", "Outage resolution within 72 hours"],
    evaluationCriteria: ["Technical plan (40%)", "Sustainability (30%)", "Team capability (30%)"],
    evidenceRequirements: ["Pole-wise audit sheet", "Night imagery before/after"],
    status: "PUBLISHED",
    priorityScore: 0,
    affectedPeople: 7800,
    createdAt: daysAgo(6),
    deadline: daysAhead(35),
    demo: true,
  },
  {
    id: "CHL-005",
    code: "UTA/MUM/2026/011",
    title: "Passenger information and shelter upgrade at Dadar stop",
    problemStatement:
      "Commuters at Dadar have no reliable arrival information and a damaged shelter, affecting more than 20,000 daily passengers.",
    background: "Verified cluster of 2 citizen reports with footfall counts from the transport authority.",
    clusterId: "CLS-005",
    district: "Mumbai",
    state: "Maharashtra",
    departmentId: "DEP-004",
    category: "Transport",
    expectedSolution: "Low-cost passenger information display concept using existing GTFS feeds plus shelter repair specification.",
    constraints: ["Use existing open data feeds", "No advertising revenue model"],
    requiredSkills: ["Data Science", "GTFS", "Dashboards"],
    budget: "INR 9 lakh",
    timelineWeeks: 14,
    successMetrics: ["Arrival accuracy within 3 minutes", "Commuter satisfaction above 70%"],
    evaluationCriteria: ["Data approach (35%)", "Cost realism (25%)", "Team capability (25%)", "Scalability (15%)"],
    evidenceRequirements: ["Prototype screenshots", "Field trial log"],
    status: "APPLICATION_OPEN",
    priorityScore: 0,
    affectedPeople: 20800,
    createdAt: daysAgo(9),
    deadline: daysAhead(28),
    demo: true,
  },
  {
    id: "CHL-006",
    code: "SED/NAG/2026/004",
    title: "Make Kamptee school building safe and hygienic",
    problemStatement:
      "A government school in Kamptee has an unusable toilet block and a leaking classroom roof, affecting 1,020 students.",
    background: "Verified cluster of 2 citizen reports with a headmaster's inspection note.",
    clusterId: "CLS-006",
    district: "Nagpur",
    state: "Maharashtra",
    departmentId: "DEP-005",
    category: "Education",
    expectedSolution: "Facility audit, repair specification and a maintenance ownership plan with the school management committee.",
    constraints: ["Work during vacation", "Budget ceiling INR 7 lakh"],
    requiredSkills: ["Facility Audit", "Civil Engineering", "Volunteer Management"],
    budget: "INR 7 lakh",
    timelineWeeks: 11,
    successMetrics: ["Functional toilet block with water supply", "No classroom leakage in monsoon"],
    evaluationCriteria: ["Audit quality (35%)", "Community ownership (30%)", "Team capability (35%)"],
    evidenceRequirements: ["Audit sheet", "Before/after photos", "Committee sign-off"],
    status: "SUBMITTED",
    priorityScore: 0,
    affectedPeople: 1020,
    createdAt: daysAgo(30),
    deadline: daysAhead(12),
    demo: true,
  },
];

export const demoApplications: Application[] = [
  {
    id: "APP-001",
    challengeId: "CHL-001",
    teamId: "TEA-001",
    teamName: "COEP RoadSense",
    status: "selected",
    matchScore: 0,
    submittedAt: daysAgo(20),
    proposal: {
      approach:
        "Drone and mobile-phone based surface survey, GIS-based water flow modelling, and a phased repair plan with an interim safety intervention before monsoon.",
      timelineWeeks: 12,
      budget: "INR 10.4 lakh",
      deliverables: ["Survey dataset", "Drainage design", "Interim safety plan", "Ward monitoring dashboard"],
      risks: ["Monsoon onset delays field survey", "Utility conflict during excavation"],
    },
    evaluationNotes: "Strongest field feasibility; local team with prior ward experience.",
    demo: true,
  },
  {
    id: "APP-002",
    challengeId: "CHL-001",
    teamId: "TEA-005",
    teamName: "UrbanFlow Transit Lab",
    status: "rejected",
    matchScore: 0,
    submittedAt: daysAgo(21),
    proposal: {
      approach: "Analytics-led prioritisation of repair segments using traffic and complaint density data.",
      timelineWeeks: 10,
      budget: "INR 7.8 lakh",
      deliverables: ["Priority segment model", "Dashboard"],
      risks: ["No civil works capability in team"],
    },
    evaluationNotes: "Analytics strong but no civil engineering capability for the works component.",
    demo: true,
  },
  {
    id: "APP-003",
    challengeId: "CHL-002",
    teamId: "TEA-004",
    teamName: "Jal Seva Field Unit",
    status: "shortlisted",
    matchScore: 0,
    submittedAt: daysAgo(11),
    proposal: {
      approach: "Night-flow leak detection with community water committees and a household-level supply log.",
      timelineWeeks: 10,
      budget: "INR 6.2 lakh",
      deliverables: ["Leak survey report", "Valve schedule", "Community monitoring kit"],
      risks: ["Access to private premises for metering"],
    },
    demo: true,
  },
  {
    id: "APP-004",
    challengeId: "CHL-002",
    teamId: "TEA-002",
    teamName: "VJTI AquaGrid",
    status: "under_evaluation",
    matchScore: 0,
    submittedAt: daysAgo(9),
    proposal: {
      approach: "Low-cost IoT pressure sensors at valve points with anomaly detection to localise leaks.",
      timelineWeeks: 12,
      budget: "INR 6.9 lakh",
      deliverables: ["Sensor deployment plan", "Anomaly detection notebook", "Leak map"],
      risks: ["Sensor procurement lead time"],
    },
    demo: true,
  },
  {
    id: "APP-005",
    challengeId: "CHL-003",
    teamId: "TEA-003",
    teamName: "COEP CleanCycle",
    status: "submitted",
    matchScore: 0,
    submittedAt: daysAgo(4),
    proposal: {
      approach: "Capacitated vehicle routing model on existing fleet with bin-fill heuristics and a driver compliance tracker.",
      timelineWeeks: 8,
      budget: "INR 3.4 lakh",
      deliverables: ["Route plan", "Bin placement map", "Compliance tracker"],
      risks: ["Driver adoption of new routes"],
    },
    demo: true,
  },
  {
    id: "APP-006",
    challengeId: "CHL-006",
    teamId: "TEA-006",
    teamName: "Polytechnic LightWorks",
    status: "selected",
    matchScore: 0,
    submittedAt: daysAgo(26),
    proposal: {
      approach: "Facility audit with the school management committee, repair specification and maintenance ownership plan.",
      timelineWeeks: 11,
      budget: "INR 6.6 lakh",
      deliverables: ["Audit sheet", "Repair specification", "Maintenance plan"],
      risks: ["Vacation schedule constraints"],
    },
    demo: true,
  },
];

export const demoProjects: Project[] = [
  {
    id: "PRJ-001",
    code: "PRJ/PUN/2026/001",
    challengeId: "CHL-001",
    teamId: "TEA-001",
    teamName: "COEP RoadSense",
    officerId: "USR-005",
    officerName: "Officer P. Rane",
    universityId: "UNI-001",
    mentorOrganizationId: "ORG-001",
    status: "IN_PROGRESS",
    progress: 62,
    startedAt: daysAgo(18),
    dueAt: daysAhead(48),
    milestones: [
      { id: "MS-001", title: "Baseline survey & data collection", dueDate: daysAgo(8), status: "approved", progress: 100 },
      { id: "MS-002", title: "Drainage & flow analysis", dueDate: daysAhead(4), status: "submitted", progress: 90 },
      { id: "MS-003", title: "Interim safety intervention", dueDate: daysAhead(18), status: "in_progress", progress: 40 },
      { id: "MS-004", title: "Final repair design & handover", dueDate: daysAhead(44), status: "pending", progress: 0 },
    ],
    tasks: [
      { id: "TSK-001", title: "Complete 1.4 km surface scan", assignee: "Rahul Iyer", status: "done" },
      { id: "TSK-002", title: "Model water retention points", assignee: "Sneha Patil", status: "doing" },
      { id: "TSK-003", title: "Interim barricade & signage plan", assignee: "Aman Shaikh", status: "doing" },
      { id: "TSK-004", title: "Cost estimate with PWD schedule of rates", assignee: "Divya Rao", status: "todo" },
    ],
    updates: [
      { id: "UPD-001", author: "Rahul Iyer", body: "Surface scan complete for full stretch; 41 damage segments recorded with GPS tags.", createdAt: daysAgo(9) },
      { id: "UPD-002", author: "GreenCivic Solutions (mentor)", body: "Reviewed flow model assumptions; suggested checking the ward drain invert levels.", createdAt: daysAgo(5) },
      { id: "UPD-003", author: "Officer P. Rane", body: "Milestone 1 verified on site. Please submit interim safety plan before monsoon week.", createdAt: daysAgo(3) },
    ],
    demo: true,
  },
  {
    id: "PRJ-002",
    code: "PRJ/NAG/2026/004",
    challengeId: "CHL-006",
    teamId: "TEA-006",
    teamName: "Polytechnic LightWorks",
    officerId: "USR-005",
    officerName: "Officer P. Rane",
    universityId: "UNI-003",
    mentorOrganizationId: "ORG-004",
    status: "VERIFICATION",
    progress: 96,
    startedAt: daysAgo(28),
    dueAt: daysAhead(12),
    milestones: [
      { id: "MS-101", title: "Facility audit", dueDate: daysAgo(20), status: "approved", progress: 100 },
      { id: "MS-102", title: "Toilet block restoration", dueDate: daysAgo(8), status: "approved", progress: 100 },
      { id: "MS-103", title: "Roof leakage repair", dueDate: daysAgo(2), status: "submitted", progress: 95 },
    ],
    tasks: [
      { id: "TSK-101", title: "Water connection restoration", assignee: "Suresh Meshram", status: "done" },
      { id: "TSK-102", title: "Roof sheet replacement", assignee: "Ankita Gawande", status: "done" },
      { id: "TSK-103", title: "Maintenance handover to committee", assignee: "Suresh Meshram", status: "doing" },
    ],
    updates: [
      { id: "UPD-101", author: "Suresh Meshram", body: "Toilet block functional with restored water supply; before/after photos uploaded.", createdAt: daysAgo(7) },
      { id: "UPD-102", author: "Suresh Meshram", body: "Submitted completion evidence for government verification.", createdAt: daysAgo(1) },
    ],
    demo: true,
  },
];

export const demoEvidence: Evidence[] = [
  { id: "EVD-001", projectId: "PRJ-001", kind: "image", label: "Kothrud stretch baseline photo set", storageKey: "r2://evidence/PRJ-001/baseline-photos.zip", ownerId: "USR-002", ownerName: "Rahul Iyer", createdAt: daysAgo(12), verificationState: "verified", sizeKb: 8420, demo: true },
  { id: "EVD-002", projectId: "PRJ-001", kind: "document", label: "Survey dataset & damage segment log", storageKey: "r2://evidence/PRJ-001/survey-dataset.csv", ownerId: "USR-002", ownerName: "Rahul Iyer", createdAt: daysAgo(9), verificationState: "verified", sizeKb: 1240, demo: true },
  { id: "EVD-003", projectId: "PRJ-001", kind: "report", label: "Drainage flow analysis draft", storageKey: "r2://evidence/PRJ-001/flow-analysis.pdf", ownerId: "USR-002", ownerName: "Sneha Patil", createdAt: daysAgo(4), verificationState: "pending", sizeKb: 2760, demo: true },
  { id: "EVD-004", projectId: "PRJ-002", kind: "before_after", label: "Toilet block before/after imagery", storageKey: "r2://evidence/PRJ-002/before-after.zip", ownerId: "USR-002", ownerName: "Suresh Meshram", createdAt: daysAgo(7), verificationState: "verified", sizeKb: 6100, demo: true },
  { id: "EVD-005", projectId: "PRJ-002", kind: "completion", label: "Completion report with committee sign-off", storageKey: "r2://evidence/PRJ-002/completion-report.pdf", ownerId: "USR-002", ownerName: "Suresh Meshram", createdAt: daysAgo(1), verificationState: "pending", sizeKb: 1890, demo: true },
];

export const demoAuditLogs: AuditLog[] = [
  { id: "LOG-001", actorId: "USR-005", actorName: "Officer P. Rane", actorRole: "officer", action: "REPORT_VERIFIED", entityType: "citizen_report", entityId: "RPT-1003", detail: "Verified after ward site inspection", createdAt: daysAgo(19) },
  { id: "LOG-002", actorId: "USR-005", actorName: "Officer P. Rane", actorRole: "officer", action: "CLUSTER_CONVERTED", entityType: "problem_cluster", entityId: "CLS-001", detail: "Converted cluster into challenge PWD/PUN/2026/001", createdAt: daysAgo(24) },
  { id: "LOG-003", actorId: "USR-006", actorName: "Smt. R. Bhosale", actorRole: "gov_admin", action: "APPLICATION_SELECTED", entityType: "application", entityId: "APP-001", detail: "Selected COEP RoadSense for CHL-001", createdAt: daysAgo(19) },
  { id: "LOG-004", actorId: "USR-005", actorName: "Officer P. Rane", actorRole: "officer", action: "MILESTONE_APPROVED", entityType: "project_milestone", entityId: "MS-001", detail: "Baseline survey milestone approved on site", createdAt: daysAgo(3) },
  { id: "LOG-005", actorId: "USR-007", actorName: "Platform Admin", actorRole: "platform_admin", action: "ORG_VERIFIED", entityType: "organization", entityId: "ORG-002", detail: "Verified Jal Seva Foundation registration documents", createdAt: daysAgo(15) },
  { id: "LOG-006", actorId: "USR-005", actorName: "Officer P. Rane", actorRole: "officer", action: "REPORT_REJECTED", entityType: "citizen_report", entityId: "RPT-1018", detail: "Enforcement matter, routed to traffic police", createdAt: daysAgo(6) },
];
