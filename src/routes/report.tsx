import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Loader2, Sparkles, Upload } from "lucide-react";
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

const STEPS = ["Describe", "Location", "Impact", "Evidence", "Review"] as const;
const FREQUENCIES: CitizenReport["frequency"][] = ["one_time", "occasional", "frequent", "continuous"];
const DISTRICTS = ["Pune", "Mumbai", "Nashik", "Nagpur", "Aurangabad", "Thane"];

function ReportPage() {
  const { user, actor } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: "",
    description: "",
    locality: "",
    district: "Pune",
    state: "Maharashtra",
    lat: "",
    lng: "",
    severity: 3,
    affectedPeople: 100,
    frequency: "frequent" as CitizenReport["frequency"],
    vulnerability: 3,
    existingService: "",
    contact: "",
    evidenceLabels: [] as string[],
  });

  const structured = useMemo(
    () =>
      form.description.trim().length > 20
        ? structureProblem({ text: `${form.title}. ${form.description}`, severity: form.severity })
        : null,
    [form.title, form.description, form.severity],
  );

  const duplicates = useQuery({
    queryKey: ["duplicates", form.title, form.description, form.district, form.locality],
    queryFn: () =>
      problemService.duplicates({
        title: form.title,
        description: form.description,
        category: structured?.category,
        district: form.district,
        locality: form.locality,
        ...(form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : {}),
      }),
    enabled: step >= 1 && form.description.trim().length > 20,
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Please sign in before submitting a report");
      return problemService.create(
        {
          title: form.title,
          description: form.description,
          category: structured?.category ?? "General Civic",
          subcategory: structured?.subcategory ?? "Uncategorised",
          locality: form.locality,
          district: form.district,
          state: form.state,
          ...(form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : {}),
          severity: form.severity,
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
      toast.success(`Report ${report.id} submitted for review`);
      void navigate({ to: "/reports/$reportId", params: { reportId: report.id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const stepValid = [
    form.title.trim().length > 5 && form.description.trim().length > 20,
    form.locality.trim().length > 1 && Boolean(form.district),
    form.affectedPeople > 0,
    true,
    true,
  ][step];

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

        {/* Stepper */}
        <ol className="mt-8 flex flex-wrap gap-2">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(i)}
                className={cn(
                  "flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-medium",
                  i === step && "border-primary bg-primary/15 text-primary",
                  i < step && "border-success/40 bg-success/10 text-success",
                  i > step && "border-border text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3.5" aria-hidden /> : <span className="font-mono">{i + 1}</span>}
                {label}
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-md border border-border bg-card p-6">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="title">Problem title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Road broken near Shivaji School"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="description">Describe your problem in your own words</Label>
                <Textarea
                  id="description"
                  rows={6}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="The road is broken near our school and during rain water stays there…"
                  className="mt-1.5"
                />
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

          {step === 1 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="locality">Locality / area</Label>
                  <Input
                    id="locality"
                    value={form.locality}
                    onChange={(e) => setForm({ ...form, locality: e.target.value })}
                    placeholder="e.g. Kothrud"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="district">District</Label>
                  <Select value={form.district} onValueChange={(v) => setForm({ ...form, district: v })}>
                    <SelectTrigger id="district" className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="mt-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="lat">Latitude (optional)</Label>
                    <Input id="lat" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="18.507" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="lng">Longitude (optional)</Label>
                    <Input id="lng" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="73.807" className="mt-1.5" />
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

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label>Severity: {form.severity}/5</Label>
                <Slider
                  value={[form.severity]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={([v]) => setForm({ ...form, severity: v ?? 3 })}
                  className="mt-3"
                />
              </div>
              <div>
                <Label htmlFor="affected">Approximate number of people affected</Label>
                <Input
                  id="affected"
                  type="number"
                  min={1}
                  value={form.affectedPeople}
                  onChange={(e) => setForm({ ...form, affectedPeople: Number(e.target.value) })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="frequency">How often does this happen?</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(v) => setForm({ ...form, frequency: v as CitizenReport["frequency"] })}
                >
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
              <div>
                <Label>Vulnerable groups affected (children, elderly, patients): {form.vulnerability}/5</Label>
                <Slider
                  value={[form.vulnerability]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={([v]) => setForm({ ...form, vulnerability: v ?? 3 })}
                  className="mt-3"
                />
              </div>
              <div>
                <Label htmlFor="service">Existing government service, if known</Label>
                <Input
                  id="service"
                  value={form.existingService}
                  onChange={(e) => setForm({ ...form, existingService: e.target.value })}
                  placeholder="e.g. Ward office complaint 4821"
                  className="mt-1.5"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="evidence">Attach evidence</Label>
                <div className="mt-1.5 rounded-md border border-dashed border-border bg-surface p-6 text-center">
                  <Upload className="mx-auto size-5 text-muted-foreground" aria-hidden />
                  <p className="mt-2 text-sm text-muted-foreground">
                    In the deployed build, files upload to object storage and only the metadata and storage
                    key are stored in the database. In this prototype, list the evidence you would attach.
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
              </div>
              <div>
                <Label htmlFor="contact">Contact number (optional, never published)</Label>
                <Input
                  id="contact"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold">Review before submitting</h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Title", form.title || "—"],
                  ["Category", structured?.category ?? "—"],
                  ["Subcategory", structured?.subcategory ?? "—"],
                  ["Location", `${form.locality || "—"}, ${form.district}, ${form.state}`],
                  ["Severity", `${form.severity}/5`],
                  ["People affected", form.affectedPeople.toLocaleString("en-IN")],
                  ["Frequency", form.frequency.replace(/_/g, " ")],
                  ["Evidence items", String(form.evidenceLabels.length)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-sm border border-border bg-surface p-3">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 text-sm font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm text-muted-foreground">{form.description}</p>
              <Button
                className="w-full sm:w-auto"
                disabled={submit.isPending || !user || !stepValid}
                onClick={() => submit.mutate()}
              >
                {submit.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />} Submit report
              </Button>
              {!user && (
                <p className="text-xs text-muted-foreground">
                  Sign in to submit. Your report is then tracked with a visible status timeline.
                </p>
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              <ChevronLeft className="size-4" aria-hidden /> Back
            </Button>
            <p className="text-xs text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </p>
            <Button
              disabled={step === STEPS.length - 1 || !stepValid}
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            >
              Continue <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
