import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import logoMark from "@/assets/civicbridge-mark.png.asset.json";
import {
  Activity,
  BarChart3,
  ClipboardCheck,
  FileStack,
  FolderKanban,
  Home,
  Landmark,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS, type Role } from "@/types";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  citizen: [
    { to: "/citizen", label: "My dashboard", icon: LayoutDashboard },
    { to: "/report", label: "Report a problem", icon: FileStack },
    { to: "/challenges", label: "Explore challenges", icon: Target },
    { to: "/transparency", label: "Transparency", icon: BarChart3 },
  ],
  student: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard },
    { to: "/student/applications", label: "Applications", icon: ClipboardCheck },
    { to: "/challenges", label: "Browse challenges", icon: Target },
    { to: "/projects", label: "My projects", icon: FolderKanban },
  ],
  university: [
    { to: "/university", label: "Dashboard", icon: LayoutDashboard },
    { to: "/challenges", label: "Challenges", icon: Target },
    { to: "/projects", label: "Projects", icon: FolderKanban },
  ],
  organization: [
    { to: "/organization", label: "Dashboard", icon: LayoutDashboard },
    { to: "/challenges", label: "Challenges", icon: Target },
    { to: "/projects", label: "Mentored projects", icon: FolderKanban },
  ],
  officer: [
    { to: "/government", label: "Dashboard", icon: LayoutDashboard },
    { to: "/government/review", label: "Report review", icon: ClipboardCheck },
    { to: "/government/clusters", label: "Clusters & priority", icon: Layers },
    { to: "/government/challenges", label: "Challenges", icon: Target },
    { to: "/government/verification", label: "Verification queue", icon: ShieldCheck },
    { to: "/projects", label: "Projects", icon: FolderKanban },
  ],
  gov_admin: [
    { to: "/government", label: "Dashboard", icon: LayoutDashboard },
    { to: "/government/review", label: "Report review", icon: ClipboardCheck },
    { to: "/government/clusters", label: "Clusters & priority", icon: Layers },
    { to: "/government/challenges", label: "Challenges", icon: Target },
    { to: "/government/verification", label: "Verification queue", icon: ShieldCheck },
    { to: "/impact", label: "Impact analytics", icon: BarChart3 },
  ],
  platform_admin: [
    { to: "/admin", label: "Administration", icon: LayoutDashboard },
    { to: "/government", label: "Government view", icon: Landmark },
    { to: "/challenges", label: "Challenges", icon: Target },
    { to: "/projects", label: "Projects", icon: FolderKanban },
    { to: "/impact", label: "Analytics", icon: BarChart3 },
  ],
  super_admin: [
    { to: "/admin", label: "Administration", icon: LayoutDashboard },
    { to: "/government", label: "Government view", icon: Landmark },
    { to: "/government/clusters", label: "Clusters & priority", icon: Layers },
    { to: "/challenges", label: "Challenges", icon: Target },
    { to: "/projects", label: "Projects", icon: FolderKanban },
    { to: "/impact", label: "Analytics", icon: BarChart3 },
  ],
};


export function AppShell({ children, allow }: { children: ReactNode; allow?: Role[] }) {
  const { user, logout, hydrated } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) void navigate({ to: "/auth", replace: true });
    else if (allow && !allow.includes(user.role)) void navigate({ to: "/unauthorized", replace: true });
  }, [hydrated, user, allow, navigate]);

  useEffect(() => setOpen(false), [pathname]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Restoring your session…
      </div>
    );
  }
  if (!user) return null;
  if (allow && !allow.includes(user.role)) return null;

  const nav = NAV_BY_ROLE[user.role];

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="gov-stripe h-1 w-full" aria-hidden />
        <div className="flex h-full flex-col">
          <Link to="/" className="flex items-center gap-2.5 px-4 py-4">
            <img
              src={logoMark.url}
              alt="CivicBridge logo"
              width={816}
              height={816}
              className="size-9 shrink-0 object-contain"
            />
            <span className="leading-tight">
              <span className="block font-display text-sm font-semibold text-sidebar-foreground">CivicBridge</span>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {ROLE_LABELS[user.role]}
              </span>
            </span>
          </Link>

          <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2" aria-label="Workspace">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                activeOptions={{ exact: item.to.split("/").length <= 2 }}
                className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <div className="mt-3 flex gap-2">
              <Link to="/" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Home className="size-3.5" aria-hidden /> Public site
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Sign out"
                onClick={() => {
                  logout();
                  void navigate({ to: "/auth", replace: true });
                }}
              >
                <LogOut className="size-3.5" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {open && (
        <button
          className="fixed inset-0 z-30 bg-background/70 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
          <Button variant="outline" size="icon" aria-label="Open navigation" onClick={() => setOpen(true)}>
            <Menu className="size-4" aria-hidden />
          </Button>
          <span className="flex items-center gap-2 font-display text-sm font-semibold">
            <Activity className="size-4 text-primary" aria-hidden /> CivicBridge
          </span>
        </header>
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
