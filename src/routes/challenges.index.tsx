import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHeader } from "@/components/common/StatCard";
import { DataState } from "@/components/common/DataState";
import { ChallengeStatusBadge, Pill, PriorityBadge } from "@/components/common/StatusBadge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { challengeService } from "@/services";

export const Route = createFileRoute("/challenges/")({
  head: () => ({
    meta: [
      { title: "Civic challenges open for solutions — CivicBridge" },
      {
        name: "description",
        content:
          "Browse official government challenges created from verified citizen problem clusters, with priority scores, required skills and timelines.",
      },
      { property: "og:title", content: "Civic challenges open for solutions" },
      {
        property: "og:description",
        content: "Explore verified civic challenges across districts and apply with your team.",
      },
    ],
  }),
  component: ChallengesPage,
});

function ChallengesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const query = useQuery({ queryKey: ["challenges"], queryFn: () => challengeService.list() });

  const categories = Array.from(new Set((query.data ?? []).map((c) => c.category)));

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <PageHeader
          eyebrow="Open challenges"
          title="Verified civic challenges"
          description="Each challenge originates from verified citizen reports grouped into a problem cluster. Priority scores are computed, not assigned by hand."
        />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, district or department code"
            aria-label="Search challenges"
            className="sm:max-w-md"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="sm:w-56" aria-label="Filter by category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-8">
          <DataState
            isLoading={query.isLoading}
            isError={query.isError}
            error={query.error}
            data={query.data}
            onRetry={() => void query.refetch()}
            loadingLabel="Loading challenges…"
            isEmpty={(d) =>
              d.filter(
                (c) =>
                  (category === "all" || c.category === category) &&
                  `${c.title} ${c.district} ${c.code}`.toLowerCase().includes(search.toLowerCase()),
              ).length === 0
            }
            emptyTitle="No challenges match your filters"
            emptyDescription="Try a different category or clear the search text."
          >
            {(data) => (
              <ul className="grid gap-4 lg:grid-cols-2">
                {data
                  .filter(
                    (c) =>
                      (category === "all" || c.category === category) &&
                      `${c.title} ${c.district} ${c.code}`.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((challenge) => (
                    <li key={challenge.id}>
                      <Link
                        to="/challenges/$challengeId"
                        params={{ challengeId: challenge.id }}
                        className="group flex h-full flex-col rounded-md border border-border bg-card p-5 transition-colors hover:border-primary/60"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <ChallengeStatusBadge status={challenge.status} />
                          <PriorityBadge score={challenge.priorityScore} />
                          <Pill>{challenge.category}</Pill>
                        </div>
                        <p className="mt-3 font-mono text-xs text-muted-foreground">{challenge.code}</p>
                        <h2 className="mt-1 font-display text-lg font-semibold group-hover:text-primary">
                          {challenge.title}
                        </h2>
                        <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                          {challenge.problemStatement}
                        </p>
                        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
                          <div>
                            <dt className="text-muted-foreground">Location</dt>
                            <dd className="font-medium">
                              {challenge.district}, {challenge.state}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">People affected</dt>
                            <dd className="font-medium tabular-nums">
                              {challenge.affectedPeople.toLocaleString("en-IN")}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Timeline</dt>
                            <dd className="font-medium">{challenge.timelineWeeks} weeks</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Skills</dt>
                            <dd className="font-medium">{challenge.requiredSkills.slice(0, 2).join(", ")}</dd>
                          </div>
                        </dl>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </DataState>
        </div>
      </div>
    </PublicLayout>
  );
}
