import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Dot,
  Loader2,
  Lock,
  Sparkles,
  Upload,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHeader } from "@/components/common/StatCard";
import { Pill } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { problemService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { structureProblem } from "@/lib/engines/structuring";
import { riskPercentToSeverity, suggestImpact } from "@/lib/engines/impact";
import type { CitizenReport } from "@/types";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a civic problem — CivicBridge" },
      {
        name: "description",
        content:
          "Describe a civic problem in your own words. CivicBridge structures it, checks for similar reports nearby and routes it for government verification.",
      },
      { property: "og:title", content: "Report a civic problem — CivicBridge" },
      {
        property: "og:description",
        content: "A guided form that turns your description into a structured, trackable civic report.",
      },
    ],
  }),
  component: ReportPage,
});

const STEPS = ["Domain / Challenge", "Impact", "Location", "Details & Review"] as const;
const FREQUENCIES: CitizenReport["frequency"][] = ["one_time", "occasional", "frequent", "continuous"];
const DISTRICTS = ["Pune", "Mumbai", "Nashik", "Nagpur", "Aurangabad", "Thane"];
const DOMAINS = [
  "Infrastructure",
  "Water & Sanitation",
  "Sanitation",
  "Utilities",
  "Transport",
  "Education",
  "Health",
  "General Civic",
];
const DRAFT_KEY = "civicbridge.report.draft.v2";

type FormState = {
  domain: string;
  title: string;
  description: string;
  impactSummary: string;
  riskPercent: number;
  impactDescription: string;
  affectedPeople: number;
  frequency: CitizenReport["frequency"];
  vulnerability: number;
  locality: string;
  district: string;
  state: string;
  lat: string;
  lng: string;
  existingService: string;
  contact: string;
  evidenceLabels: string[];
};

const EMPTY: FormState = {
  domain: "",
  title: "",
  description: "",
  impactSummary: "",
  riskPercent: 50,
  impactDescription: "",
  affectedPeople: 0,
  frequency: "frequent",
  vulnerability: 3,
  locality: "",
  district: "Pune",
  state: "Maharashtra",
  lat: "",
  lng: "",
  existingService: "",
  contact: "",
  evidenceLabels: [],
};

type Errors = Partial<Record<keyof FormState, string>>;

function validateStep(step: number, f: FormState): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!f.domain) e.domain = "Select the domain this problem belongs to.";
    if (f.title.trim().length < 6) e.title = "Enter a problem title of at least 6 characters.";
    if (f.description.trim().length < 20)
      e.description = "Describe the problem in at least 20 characters so it can be structured.";
  }
  if (step === 1) {
    if (f.impactSummary.trim().length < 6) e.impactSummary = "Describe the impact in at least 6 characters.";
    if (!Number.isFinite(f.riskPercent) || f.riskPercent < 0 || f.riskPercent > 100)
      e.riskPercent = "Risk percentage must be between 0 and 100.";
    if (f.impactDescription.trim().length < 20)
      e.impactDescription = "Add a description of at least 20 characters explaining the impact.";
    if (!Number.isFinite(f.affectedPeople) || f.affectedPeople < 1)
      e.affectedPeople = "Enter how many people are affected (at least 1).";
  }
  if (step === 2) {
    if (f.locality.trim().length < 2) e.locality = "Enter the locality or area.";
    if (!f.district) e.district = "Select a district.";
    if (f.state.trim().length < 2) e.state = "Enter the state.";
    if (f.lat && Number.isNaN(Number(f.lat))) e.lat = "Latitude must be a number.";
    if (f.lng && Number.isNaN(Number(f.lng))) e.lng = "Longitude must be a number.";
  }
  if (step === 3) {
    if (f.evidenceLabels.length < 1) e.evidenceLabels = "List at least one piece of evidence.";
    if (f.contact && !/^[0-9+\-\s]{6,15}$/.test(f.contact.trim()))
      e.contact = "Enter a valid contact number or leave it blank.";
  }
  return e;
}

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden /> {message}
    </p>
  );
}

function ReportPage() {
  const { user, actor } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});
  const [form, setForm] = useState<FormState>(EMPTY);
  const [restored, setRestored] = useState(false);

  /* draft persistence so a refresh never loses entered data */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setForm({ ...EMPTY, ...(JSON.parse(raw) as Partial<FormState>) });
    } catch {
      /* ignore unreadable drafts */
    }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* storage full or unavailable */
    }
  }, [form, restored]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const stepErrors = useMemo(() => STEPS.map((_, i) => validateStep(i, form)), [form]);
  const stepValid = stepErrors.map((e) => Object.keys(e).length === 0);
  /* a step is completed only when its own fields validate — never because it was visited */
  const completed = stepValid;
  /* a step is reachable only when every step before it is valid */
  const unlocked = STEPS.map((_, i) => stepValid.slice(0, i).every(Boolean));
  const errors = attempted[step] ? stepErrors[step]! : {};
  const allValid = stepValid.every(Boolean);

  const structured = useMemo(
    () =>
      form.description.trim().length > 20
        ? structureProblem({
            text: `${form.title}. ${form.description}`,
            severity: riskPercentToSeverity(form.riskPercent),
          })
        : null,
    [form.title, form.description, form.riskPercent],
  );

  const suggestion = useMemo(
    () =>
      form.description.trim().length > 20
        ? suggestImpact({
            title: `${form.domain} ${form.title}`,
            description: form.description,
            affectedPeople: form.affectedPeople,
            frequency: form.frequency,
            vulnerability: form.vulnerability,
          })
        : null,
    [form.domain, form.title, form.description, form.affectedPeople, form.frequency, form.vulnerability],
  );

  const duplicates = useQuery({
    queryKey: ["duplicates", form.title, form.description, form.district, form.locality],
    queryFn: () =>
      problemService.duplicates({
        title: form.title,
        description: form.description,
        category: structured?.category ?? form.domain,
        district: form.district,
        locality: form.locality,
        ...(form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : {}),
      }),
    enabled: step === 2 && form.description.trim().length > 20,
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Please sign in before submitting a report");
      if (!allValid) throw new Error("Complete every step before submitting");
      return problemService.create(
        {
          title: form.title,
          description: `${form.description}\n\nImpact: ${form.impactSummary}\nRisk: ${form.riskPercent}%\n${form.impactDescription}`,
          category: structured?.category ?? form.domain,
          subcategory: structured?.subcategory ?? "Uncategorised",
          locality: form.locality,
          district: form.district,
          state: form.state,
          ...(form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : {}),
          // Risk percentage is stored through the existing severity column (1-5).
          severity: riskPercentToSeverity(form.riskPercent),
          affectedPeople: form.affectedPeople,
          frequency: form.frequency,
          vulnerability: form.vulnerability,
          evidenceCount: form.evidenceLabels.length,
          reporterId: actor.id,
          reporterName: actor.name,
        },
        actor,
      );
    },
    onSuccess: (report) => {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      toast.success(`Report ${report.id} submitted for review`);
      void navigate({ to: "/reports/$reportId", params: { reportId: report.id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const goNext = () => {
    setAttempted((a) => ({ ...a, [step]: true }));
    if (!stepValid[step]) {
      toast.error("Complete the required fields on this step before continuing");
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const goToStep = (i: number) => {
    if (i === step) return;
    if (i < step || unlocked[i]) {
      setStep(i);
      return;
    }
    setAttempted((a) => ({ ...a, [step]: true }));
    toast.error("Finish the current step first — later steps stay locked until then");
  };

  const applySuggestion = (patch: Partial<FormState>, label: string) => {
    setForm((f) => ({ ...f, ...patch }));
    toast.success(`${label} applied — you can still edit it`);
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <PageHeader
          eyebrow="Citizen reporting"
          title="Report a civic problem"
          description="Describe the problem in your own words. The platform structures it, checks for similar reports nearby and sends it for government verification."
        />

        {!user && (
          <div className="mt-6 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
            You can fill this form, but you need to{" "}
            <Link to="/auth" className="font-medium text-primary hover:underline">
              sign in
            </Link>{" "}
            before submitting so the report can be tracked against your account.
          </div>
        )}

        {/* Stepper — ✓ only for genuinely valid steps, lock for unreachable ones */}
        <ol className="mt-8 flex flex-wrap gap-2">
          {STEPS.map((label, i) => {
            const isCurrent = i === step;
            const isDone = completed[i] && !isCurrent;
            const isLocked = !unlocked[i] && !isCurrent;
            const hasError = isCurrent && attempted[i] && !stepValid[i];
            return (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => goToStep(i)}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-disabled={isLocked}
                  className={cn(
                    "flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-medium",
                    isCurrent && !hasError && "border-primary bg-primary/15 text-primary",
                    hasError && "border-destructive bg-destructive/10 text-destructive",
                    isDone && "border-success/40 bg-success/10 text-success",
                    !isCurrent && !isDone && "border-border text-muted-foreground",
                    isLocked && "cursor-not-allowed opacity-70",
                  )}
                >
                  {isDone ? (
                    <Check className="size-3.5" aria-hidden />
                  ) : hasError ? (
                    <AlertCircle className="size-3.5" aria-hidden />
                  ) : isCurrent ? (
                    <Dot className="size-3.5 fill-current" aria-hidden />
                  ) : isLocked ? (
                    <Lock className="size-3.5" aria-hidden />
                  ) : (
                    <Circle className="size-3.5" aria-hidden />
                  )}
                  <span className="font-mono">{i + 1}</span>
                  {label}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 rounded-md border border-border bg-card p-6">
          {/* ---------------------------- Step 1: Domain ---------------------------- */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="domain">Domain / challenge area *</Label>
                <Select value={form.domain} onValueChange={(v) => set("domain", v)}>
                  <SelectTrigger id="domain" className="mt-1.5 w-full">
                    <SelectValue placeholder="Select the domain of this problem" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.domain} />
              </div>
              <div>
                <Label htmlFor="title">Problem title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Road broken near Shivaji School"
                  className="mt-1.5"
                />
                <FieldError message={errors.title} />
              </div>
              <div>
                <Label htmlFor="description">Describe the problem in your own words *</Label>
                <Textarea
                  id="description"
                  rows={6}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="The road is broken near our school and during rain water stays there…"
                  className="mt-1.5"
                />
                <FieldError message={errors.description} />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Write naturally in plain language. Structuring happens automatically.
                </p>
              </div>

              {structured && (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Sparkles className="size-4" aria-hidden /> Structured interpretation ·{" "}
                    {Math.round(structured.confidence * 100)}% confidence
                  </p>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    {[
                      ["Category", structured.category],
                      ["Subcategory", structured.subcategory],
                      ["Issues", structured.issues.join(", ")],
                      ["Affected group", structured.affectedGroup],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 text-xs text-muted-foreground">
                    A government officer reviews and can correct this classification during verification.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------- Step 2: Impact ---------------------------- */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="impact">Impact *</Label>
                <Input
                  id="impact"
                  value={form.impactSummary}
                  onChange={(e) => set("impactSummary", e.target.value)}
                  placeholder="e.g. Daily commute delays and accident risk for school children"
                  className="mt-1.5"
                />
                <FieldError message={errors.impactSummary} />
              </div>

              <div>
                <Label htmlFor="risk">Risk Percentage (%) *</Label>
                <div className="mt-3 flex items-center gap-4">
                  <Slider
                    value={[Math.max(0, Math.min(100, form.riskPercent || 0))]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => set("riskPercent", v ?? 0)}
                    className="flex-1"
                  />
                  <Input
                    id="risk"
                    type="number"
                    min={0}
                    max={100}
                    value={String(form.riskPercent)}
                    onChange={(e) => set("riskPercent", e.target.value === "" ? NaN : Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <FieldError message={errors.riskPercent} />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  0–100 only. This drives the severity weighting in the priority score.
                </p>
              </div>

              <div>
                <Label htmlFor="impact-description">Description *</Label>
                <Textarea
                  id="impact-description"
                  rows={5}
                  value={form.impactDescription}
                  onChange={(e) => set("impactDescription", e.target.value)}
                  placeholder="Explain who is affected, how often, and what happens if this is not fixed…"
                  className="mt-1.5"
                />
                <FieldError message={errors.impactDescription} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="affected">Approximate number of people affected *</Label>
                  <Input
                    id="affected"
                    type="number"
                    min={1}
                    value={String(form.affectedPeople)}
                    onChange={(e) => set("affectedPeople", e.target.value === "" ? NaN : Number(e.target.value))}
                    className="mt-1.5"
                  />
                  <FieldError message={errors.affectedPeople} />
                </div>
                <div>
                  <Label htmlFor="frequency">How often does this happen?</Label>
                  <Select value={form.frequency} onValueChange={(v) => set("frequency", v as CitizenReport["frequency"])}>
                    <SelectTrigger id="frequency" className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Vulnerable groups affected (children, elderly, patients): {form.vulnerability}/5</Label>
                <Slider
                  value={[form.vulnerability]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={([v]) => set("vulnerability", v ?? 3)}
                  className="mt-3"
                />
              </div>

              {/* AI suggestions from step 1 */}
              <div className="rounded-md border border-accent/30 bg-accent/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-accent">
                  <Sparkles className="size-4" aria-hidden /> Suggestions from your domain and description
                </p>
                {!suggestion ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Write a longer description in step 1 to get impact suggestions.
                  </p>
                ) : (
                  <div className="mt-3 space-y-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Possible impacts</p>
                      <ul className="mt-2 space-y-2">
                        {suggestion.impacts.map((imp) => (
                          <li key={imp} className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border bg-card p-2.5">
                            <span>{imp}</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => applySuggestion({ impactSummary: imp }, "Impact suggestion")}
                            >
                              Use suggestion
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-sm border border-border bg-card p-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          Suggested risk percentage: <strong>{suggestion.riskPercent}%</strong>
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => applySuggestion({ riskPercent: suggestion.riskPercent }, "Risk percentage")}
                        >
                          Use suggestion
                        </Button>
                      </div>
                      <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                        {suggestion.riskRationale.map((r) => (
                          <li key={r}>· {r}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-sm border border-border bg-card p-2.5">
                      <p className="text-xs font-medium text-muted-foreground">Suggested impact description</p>
                      <p className="mt-1">{suggestion.description}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => applySuggestion({ impactDescription: suggestion.description }, "Description")}
                      >
                        Use suggestion
                      </Button>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Risks you may have missed</p>
                      <ul className="mt-2 space-y-2">
                        {suggestion.missedRisks.map((r) => (
                          <li key={r} className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border bg-card p-2.5">
                            <span>{r}</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                applySuggestion(
                                  {
                                    impactDescription: `${form.impactDescription}${form.impactDescription ? " " : ""}${r}.`,
                                  },
                                  "Risk note",
                                )
                              }
                            >
                              Add to description
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      These are rule-based, explainable suggestions — nothing is applied to your answers unless you
                      choose it.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --------------------------- Step 3: Location --------------------------- */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="locality">Locality / area *</Label>
                  <Input
                    id="locality"
                    value={form.locality}
                    onChange={(e) => set("locality", e.target.value)}
                    placeholder="e.g. Kothrud"
                    className="mt-1.5"
                  />
                  <FieldError message={errors.locality} />
                </div>
                <div>
                  <Label htmlFor="district">District *</Label>
                  <Select value={form.district} onValueChange={(v) => set("district", v)}>
                    <SelectTrigger id="district" className="mt-1.5 w-full">
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.district} />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input id="state" value={form.state} onChange={(e) => set("state", e.target.value)} className="mt-1.5" />
                  <FieldError message={errors.state} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="lat">Latitude (optional)</Label>
                    <Input id="lat" value={form.lat} onChange={(e) => set("lat", e.target.value)} placeholder="18.507" className="mt-1.5" />
                    <FieldError message={errors.lat} />
                  </div>
                  <div>
                    <Label htmlFor="lng">Longitude (optional)</Label>
                    <Input id="lng" value={form.lng} onChange={(e) => set("lng", e.target.value)} placeholder="73.807" className="mt-1.5" />
                    <FieldError message={errors.lng} />
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border bg-surface p-4">
                <p className="text-sm font-semibold">Similar problems near this location</p>
                {duplicates.isLoading && <p className="mt-2 text-sm text-muted-foreground">Checking existing reports…</p>}
                {duplicates.isError && (
                  <p className="mt-2 text-sm text-destructive">Unable to check for similar reports right now.</p>
                )}
                {duplicates.data?.length === 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No similar problems found — this will be filed as a new report.
                  </p>
                )}
                {duplicates.data && duplicates.data.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {duplicates.data.map((d) => (
                      <li key={d.reportId} className="rounded-sm border border-border bg-card p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{d.reportId}</span>
                          <Pill tone={d.verdict === "exact_duplicate" ? "danger" : d.verdict === "highly_similar" ? "warning" : "info"}>
                            {d.verdict.replace(/_/g, " ")} · {Math.round(d.similarity * 100)}%
                          </Pill>
                        </div>
                        <p className="mt-1 text-sm">{d.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{d.reasons.join(" · ")}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Nothing is deleted automatically. An officer decides whether to merge reports during review.
                </p>
              </div>
            </div>
          )}

          {/* ----------------------- Step 4: Details & Review ----------------------- */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="evidence">Attach evidence *</Label>
                <div className="mt-1.5 rounded-md border border-dashed border-border bg-surface p-6 text-center">
                  <Upload className="mx-auto size-5 text-muted-foreground" aria-hidden />
                  <p className="mt-2 text-sm text-muted-foreground">
                    In the deployed build, files upload to object storage and only the metadata and storage key are
                    stored in the database. In this prototype, list the evidence you would attach.
                  </p>
                  <div className="mx-auto mt-4 flex max-w-md gap-2">
                    <Input
                      id="evidence"
                      placeholder="e.g. Photo of waterlogged stretch"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value) {
                            setForm((f) => ({ ...f, evidenceLabels: [...f.evidenceLabels, value] }));
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById("evidence") as HTMLInputElement | null;
                        const value = input?.value.trim();
                        if (value) {
                          setForm((f) => ({ ...f, evidenceLabels: [...f.evidenceLabels, value] }));
                          if (input) input.value = "";
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                {form.evidenceLabels.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {form.evidenceLabels.map((label, i) => (
                      <li key={`${label}-${i}`}>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, evidenceLabels: f.evidenceLabels.filter((_, j) => j !== i) }))
                          }
                          className="rounded-sm border border-border bg-surface px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {label} ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <FieldError message={errors.evidenceLabels} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="service">Existing government service, if known</Label>
                  <Input
                    id="service"
                    value={form.existingService}
                    onChange={(e) => set("existingService", e.target.value)}
                    placeholder="e.g. Ward office complaint 4821"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="contact">Contact number (optional, never published)</Label>
                  <Input id="contact" value={form.contact} onChange={(e) => set("contact", e.target.value)} className="mt-1.5" />
                  <FieldError message={errors.contact} />
                </div>
              </div>

              <div className="border-t border-border pt-5">
                <h2 className="font-display text-lg font-semibold">Review before submitting</h2>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Domain", form.domain || "—"],
                    ["Title", form.title || "—"],
                    ["Category", structured?.category ?? "—"],
                    ["Impact", form.impactSummary || "—"],
                    ["Risk percentage", `${form.riskPercent}%`],
                    ["Location", `${form.locality || "—"}, ${form.district}, ${form.state}`],
                    ["People affected", Number.isFinite(form.affectedPeople) ? form.affectedPeople.toLocaleString("en-IN") : "—"],
                    ["Evidence items", String(form.evidenceLabels.length)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-sm border border-border bg-surface p-3">
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="mt-0.5 text-sm font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-sm text-muted-foreground">{form.impactDescription}</p>

                {!allValid && (
                  <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertCircle className="size-3.5" aria-hidden /> Some earlier steps are still incomplete — open the
                    highlighted step and finish it before submitting.
                  </p>
                )}
                <Button
                  className="mt-4 w-full sm:w-auto"
                  disabled={submit.isPending || !user || !allValid}
                  onClick={() => {
                    setAttempted({ 0: true, 1: true, 2: true, 3: true });
                    submit.mutate();
                  }}
                >
                  {submit.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />} Submit report
                </Button>
                {!user && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Sign in to submit. Your report is then tracked with a visible status timeline.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              <ChevronLeft className="size-4" aria-hidden /> Back
            </Button>
            <p className="text-xs text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </p>
            <Button disabled={step === STEPS.length - 1} onClick={goNext}>
              Continue <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
