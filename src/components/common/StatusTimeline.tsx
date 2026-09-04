import { Check, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { REPORT_STATUS_LABELS, REPORT_TIMELINE, type ReportStatus } from "@/types";

export function ReportTimeline({ status, rejectionReason }: { status: ReportStatus; rejectionReason?: string | undefined }) {
  if (status === "rejected") {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
          <X className="size-4" aria-hidden /> Report rejected
        </p>
        {rejectionReason && <p className="mt-1 text-sm text-muted-foreground">{rejectionReason}</p>}
      </div>
    );
  }

  const currentIndex = REPORT_TIMELINE.indexOf(status);

  return (
    <ol className="relative space-y-0">
      {REPORT_TIMELINE.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step} className="flex gap-3 pb-5 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border",
                  done && "border-success bg-success/20 text-success",
                  active && "border-primary bg-primary/20 text-primary",
                  !done && !active && "border-border bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : <Circle className="size-2 fill-current" aria-hidden />}
              </span>
              {index < REPORT_TIMELINE.length - 1 && (
                <span className={cn("mt-1 w-px flex-1", done ? "bg-success/50" : "bg-border")} />
              )}
            </div>
            <div className="pb-1">
              <p className={cn("text-sm", active ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {REPORT_STATUS_LABELS[step]}
              </p>
              {active && <p className="text-xs text-primary">Current stage</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
