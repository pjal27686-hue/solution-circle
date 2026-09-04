import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, ScrollText, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireRole } from "@/hooks/useAuth";
import { PageHeader, StatCard } from "@/components/common/StatCard";
import { DataState } from "@/components/common/DataState";
import { Pill } from "@/components/common/StatusBadge";
import { Input } from "@/components/ui/input";
import { analyticsService, referenceService } from "@/services";
import { ROLE_LABELS } from "@/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Platform administration and audit log — CivicBridge" },
      {
        name: "description",
        content:
          "Users and roles, department and institution registry, verification queue and an append-only audit log of every state change on the platform.",
      },
      { property: "og:title", content: "Platform administration — CivicBridge" },
      { property: "og:description", content: "Every action on the platform is recorded in an append-only audit log." },
    ],
  }),
  component: () => (
    <RequireRole roles={["platform_admin", "super_admin"]}>
      <AdminDashboard />
    </RequireRole>
  ),
});

function AdminDashboard() {
  const [search, setSearch] = useState("");
  const users = useQuery({ queryKey: ["users"], queryFn: referenceService.users });
  const departments = useQuery({ queryKey: ["departments"], queryFn: referenceService.departments });
  const universities = useQuery({ queryKey: ["universities"], queryFn: referenceService.universities });
  const organizations = useQuery({ queryKey: ["organizations"], queryFn: referenceService.organizations });
  const logs = useQuery({ queryKey: ["audit-logs"], queryFn: analyticsService.auditLogs });

  const unverified = (users.data ?? []).filter((u) => !u.verified);
  const filteredLogs = (logs.data ?? []).filter((log) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [log.actorName, log.action, log.entityType, log.entityId, log.detail]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administration"
        title="Platform administration"
        description="Registry of users, roles and institutions, plus the append-only audit log. Roles are stored separately from profiles and are always enforced by the backend, never by the browser."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={users.data?.length ?? "—"} icon={Users} />
        <StatCard label="Departments" value={departments.data?.length ?? "—"} icon={Building2} />
        <StatCard
          label="Institutions and partners"
          value={(universities.data?.length ?? 0) + (organizations.data?.length ?? 0)}
          icon={ShieldCheck}
        />
        <StatCard label="Audit entries" value={logs.data?.length ?? "—"} icon={ScrollText} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-lg font-semibold">Users and roles</h2>
          <DataState
            isLoading={users.isLoading}
            isError={users.isError}
            error={users.error}
            data={users.data}
            onRetry={() => void users.refetch()}
            loadingLabel="Loading users…"
            isEmpty={(d) => d.length === 0}
            emptyTitle="No users"
            skeletonRows={4}
          >
            {(data) => (
              <div className="mt-4 overflow-x-auto rounded-md border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-surface text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">Name</th>
                      <th className="px-4 py-2.5 text-left font-medium">Role</th>
                      <th className="px-4 py-2.5 text-left font-medium">Location</th>
                      <th className="px-4 py-2.5 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((user) => (
                      <tr key={user.id} className="border-t border-border">
                        <td className="px-4 py-2.5">
                          <span className="font-medium">{user.name}</span>
                          <span className="block text-xs text-muted-foreground">{user.email}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <Pill tone="primary">{ROLE_LABELS[user.role]}</Pill>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {user.district ? `${user.district}, ${user.state ?? ""}` : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <Pill tone={user.verified ? "success" : "warning"}>
                            {user.verified ? "verified" : "unverified"}
                          </Pill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DataState>
          {unverified.length > 0 && (
            <p className="mt-3 rounded-sm border border-warning/30 bg-warning/10 p-3 text-sm">
              {unverified.length} account(s) awaiting verification by a coordinator or administrator.
            </p>
          )}
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold">Registry</h2>
          <div className="mt-4 space-y-2">
            {(departments.data ?? []).map((dept) => (
              <div key={dept.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card p-4">
                <div>
                  <p className="text-sm font-medium">{dept.name}</p>
                  <p className="text-xs text-muted-foreground">{dept.state}</p>
                </div>
                <Pill>{dept.openChallenges} open</Pill>
              </div>
            ))}
            {(universities.data ?? []).map((uni) => (
              <div key={uni.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card p-4">
                <div>
                  <p className="text-sm font-medium">{uni.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {uni.district}, {uni.state} · {uni.studentCount} students
                  </p>
                </div>
                <Pill tone={uni.verified ? "success" : "warning"}>{uni.verified ? "verified" : "pending"}</Pill>
              </div>
            ))}
            {(organizations.data ?? []).map((org) => (
              <div key={org.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card p-4">
                <div>
                  <p className="text-sm font-medium">{org.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {org.type === "ngo" ? "NGO" : "Industry"} · {org.sector} · {org.district}
                  </p>
                </div>
                <Pill tone={org.verified ? "success" : "warning"}>{org.verified ? "verified" : "pending"}</Pill>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Audit log</h2>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search actor, action or record"
            className="max-w-xs"
            aria-label="Search audit log"
          />
        </div>
        <DataState
          isLoading={logs.isLoading}
          isError={logs.isError}
          error={logs.error}
          data={filteredLogs}
          onRetry={() => void logs.refetch()}
          loadingLabel="Loading audit log…"
          isEmpty={(d) => d.length === 0}
          emptyTitle="No matching audit entries"
          emptyDescription="Every verification, merge, allocation and evidence action is recorded here as it happens."
          skeletonRows={5}
        >
          {(data) => (
            <ol className="mt-4 space-y-2">
              {data.map((log) => (
                <li key={log.id} className="rounded-md border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{log.detail}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {log.actorName} · {log.action} · {log.entityType} {log.entityId}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </DataState>
      </section>
    </AppShell>
  );
}
