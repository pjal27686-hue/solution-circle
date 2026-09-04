import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Landmark, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { homeRouteForRole, useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS, type Role } from "@/types";
import { demoUsers } from "@/data/demo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CivicBridge" },
      {
        name: "description",
        content: "Sign in or register as a citizen, student, university, organization or government user.",
      },
      { property: "og:title", content: "Sign in — CivicBridge" },
      { property: "og:description", content: "Access your CivicBridge role workspace." },
    ],
  }),
  component: AuthPage,
});

const REGISTER_ROLES: Role[] = ["citizen", "student", "university", "organization"];

function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("citizen@demo.in");
  const [name, setName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [role, setRole] = useState<Role>("citizen");
  const [district, setDistrict] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(email.trim());
      toast.success(`Signed in as ${user.name}`);
      void navigate({ to: homeRouteForRole(user.role) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await register({
        name: name.trim(),
        email: regEmail.trim(),
        role,
        district: district.trim() || undefined,
        state: "Maharashtra",
      });
      toast.success("Account created");
      void navigate({ to: homeRouteForRole(user.role) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:grid lg:grid-cols-[1fr_1fr]">
      <div className="hidden flex-col justify-between border-r border-border bg-card p-10 lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-sm bg-primary/15 text-primary">
            <Landmark className="size-5" aria-hidden />
          </span>
          <span className="font-display text-base font-semibold">CivicBridge</span>
        </Link>
        <div>
          <h2 className="font-display text-3xl font-semibold">
            One account, one workflow, every stakeholder.
          </h2>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            Citizens report. Government verifies and prioritises. Students, universities and
            organizations solve. Impact is measured publicly.
          </p>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Demo accounts (prototype session, no password)
          </p>
          <ul className="mt-3 grid gap-1.5 text-sm">
            {demoUsers.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  className="font-mono text-xs text-primary hover:underline"
                  onClick={() => setEmail(u.email)}
                >
                  {u.email}
                </button>
                <span className="text-xs text-muted-foreground">{ROLE_LABELS[u.role]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="font-display text-2xl font-semibold">Access your workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This prototype uses a demo session instead of passwords. Role permissions are enforced by
            the backend on every action.
          </p>

          <Tabs defaultValue="login" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Sign in
                </Button>
                <p className="text-xs text-muted-foreground lg:hidden">
                  Try citizen@demo.in, officer@demo.in, student@demo.in, admin@demo.in.
                </p>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="reg-name">Full name / organization name</Label>
                  <Input id="reg-name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="reg-email">Email address</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-role">I am registering as</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                    <SelectTrigger id="reg-role" className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REGISTER_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Government and administrator roles are provisioned by the platform, not self-selected.
                  </p>
                </div>
                <div>
                  <Label htmlFor="reg-district">District</Label>
                  <Input
                    id="reg-district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Pune"
                    className="mt-1.5"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <Link to="/" className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground">
            ← Back to the public site
          </Link>
        </div>
      </div>
    </div>
  );
}
