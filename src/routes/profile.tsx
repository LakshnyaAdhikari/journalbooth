import { createFileRoute } from "@tanstack/react-router";
import { User, LogIn } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — AltCam" },
      { name: "description", content: "Your AltCam account and settings." },
      { property: "og:title", content: "Profile — AltCam" },
      { property: "og:description", content: "Your AltCam account and settings." },
    ],
  }),
  component: Profile,
});

function Profile() {
  return (
    <div className="min-h-screen px-4 md:px-10 py-8 md:py-12">
      <header className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          <User className="h-3.5 w-3.5" /> Profile
        </div>
        <h1 className="font-display text-4xl md:text-6xl leading-[0.95] text-foreground">Sign in soon.</h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl">
          Accounts (email/password + Google) arrive in Phase 3, so photos and journal pages sync across devices.
        </p>
      </header>

      <div className="max-w-2xl mx-auto border border-border bg-card p-6 rounded-lg">
        <div className="flex items-center gap-3 text-muted-foreground">
          <LogIn className="h-5 w-5" />
          <span className="text-sm">Auth wiring coming in Phase 3.</span>
        </div>
      </div>
    </div>
  );
}
