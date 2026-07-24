import { Link, useRouterState } from "@tanstack/react-router";
import { Camera, Palette, BookHeart, Images, User, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme, AESTHETICS } from "@/lib/theme";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Capture", icon: Camera },
  { to: "/edit", label: "Edit", icon: Palette },
  { to: "/journal", label: "Journal", icon: BookHeart },
  { to: "/gallery", label: "Gallery", icon: Images },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { navCollapsed, setNavCollapsed, aesthetic, setAesthetic } = useTheme();
  const isThemed = pathname === "/" || pathname === "/edit";

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex fixed inset-y-0 left-0 z-40 flex-col border-r border-border bg-card/80 backdrop-blur transition-all duration-300",
          navCollapsed ? "w-14" : "w-60",
        )}
        style={{ borderRadius: 0 }}
      >
        <div className="flex items-center justify-between px-3 py-4 border-b border-border">
          {!navCollapsed && (
            <span className="font-display text-lg tracking-tight text-foreground">AltCam</span>
          )}
          <button
            onClick={() => setNavCollapsed(!navCollapsed)}
            className="ml-auto rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="Toggle sidebar"
          >
            {navCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
                style={{ borderRadius: "var(--nav-radius)" }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!navCollapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>
        {!navCollapsed && isThemed && (
          <div className="px-3 py-3 border-t border-border">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Aesthetic
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {AESTHETICS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAesthetic(a.id)}
                  className={cn(
                    "text-[11px] font-display px-2 py-1.5 border transition-all",
                    aesthetic === a.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground",
                  )}
                  style={{ borderRadius: "var(--nav-radius)" }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/90 backdrop-blur">
        <div className="flex items-stretch justify-around">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { navCollapsed, aesthetic } = useTheme();
  const isThemed = pathname === "/" || pathname === "/edit";
  const activeTheme = isThemed ? aesthetic : "neutral";

  return (
    <div data-theme={activeTheme === "neutral" ? undefined : activeTheme} className="min-h-screen">
      <AppNav />
      <main
        className={cn(
          "min-h-screen transition-[padding] duration-300",
          navCollapsed ? "md:pl-14" : "md:pl-60",
          "pb-20 md:pb-0",
        )}
      >
        {children}
      </main>
    </div>
  );
}
