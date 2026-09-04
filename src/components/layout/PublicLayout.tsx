import { Link } from "@tanstack/react-router";
import { Landmark, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth, homeRouteForRole } from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/types";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/challenges", label: "Challenges" },
  { to: "/transparency", label: "Transparency" },
  { to: "/impact", label: "Impact" },
] as const;

export function PublicLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="gov-stripe h-1 w-full" aria-hidden />
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-sm bg-primary/15 text-primary">
              <Landmark className="size-5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base font-semibold">CivicBridge</span>
              <span className="block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Civic Problem Resolution Platform
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "bg-secondary text-secondary-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-sm px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <>
                <Link to={homeRouteForRole(user.role)}>
                  <Button variant="outline" size="sm">
                    {ROLE_LABELS[user.role]} workspace
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/report">
                  <Button size="sm">Report a problem</Button>
                </Link>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="size-4" aria-hidden />
          </Button>
        </div>

        {open && (
          <div className="border-t border-border bg-card px-4 py-3 lg:hidden">
            <nav className="grid gap-1" aria-label="Mobile">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              {user ? (
                <Link to={homeRouteForRole(user.role)} onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-primary">
                  {ROLE_LABELS[user.role]} workspace
                </Link>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-primary">
                  Sign in
                </Link>
              )}
              <Link to="/report" onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-primary">
                Report a problem
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="font-display text-lg font-semibold">CivicBridge</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              A collaborative platform connecting citizens, government, students, universities and
              organizations to turn real-world problems into measurable public impact.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Smart India Hackathon 2026 prototype. Figures on public pages are computed from seeded
              demonstration records.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform</p>
            <ul className="mt-3 space-y-2 text-sm">
              {NAV.slice(1).map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-muted-foreground hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Participate</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/report" className="text-muted-foreground hover:text-foreground">
                  Report a problem
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-muted-foreground hover:text-foreground">
                  Sign in / register
                </Link>
              </li>
              <li>
                <Link to="/engines" className="text-muted-foreground hover:text-foreground">
                  The five engines
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
