import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { homeRouteForRole, useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({
    meta: [
      { title: "Access restricted — CivicBridge" },
      { name: "description", content: "This workspace is restricted to specific platform roles." },
      { property: "og:title", content: "Access restricted — CivicBridge" },
      { property: "og:description", content: "Your role does not have access to this workspace." },
    ],
  }),
  component: Unauthorized,
});

function Unauthorized() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <ShieldAlert className="mx-auto size-8 text-destructive" aria-hidden />
        <h1 className="mt-4 font-display text-2xl font-semibold">Access restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your role does not have permission to open this workspace. Authorisation is decided by the
          backend, not the interface.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {user && (
            <Link to={homeRouteForRole(user.role)}>
              <Button>Go to my workspace</Button>
            </Link>
          )}
          <Link to="/">
            <Button variant="outline">Public site</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
