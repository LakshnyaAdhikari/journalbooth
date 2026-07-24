import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Aesthetic = "y2k" | "kawaii" | "goth" | "chaotic";
export const AESTHETICS: { id: Aesthetic; label: string; blurb: string }[] = [
  { id: "y2k", label: "Y2K", blurb: "chrome · hot pink · digicam" },
  { id: "kawaii", label: "Kawaii", blurb: "pastel · soft · bubbly" },
  { id: "goth", label: "Goth", blurb: "crushed black · high contrast" },
  { id: "chaotic", label: "Chaotic", blurb: "deep-fried · loud · online" },
];

type Ctx = {
  aesthetic: Aesthetic;
  setAesthetic: (a: Aesthetic) => void;
  navCollapsed: boolean;
  setNavCollapsed: (v: boolean) => void;
};

const ThemeCtx = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [aesthetic, setAestheticState] = useState<Aesthetic>("y2k");
  const [navCollapsed, setNavCollapsedState] = useState(false);

  useEffect(() => {
    try {
      const a = localStorage.getItem("altcam.aesthetic") as Aesthetic | null;
      if (a && AESTHETICS.some((x) => x.id === a)) setAestheticState(a);
      const n = localStorage.getItem("altcam.navCollapsed");
      if (n) setNavCollapsedState(n === "1");
    } catch {}
  }, []);

  const setAesthetic = (a: Aesthetic) => {
    setAestheticState(a);
    try { localStorage.setItem("altcam.aesthetic", a); } catch {}
  };
  const setNavCollapsed = (v: boolean) => {
    setNavCollapsedState(v);
    try { localStorage.setItem("altcam.navCollapsed", v ? "1" : "0"); } catch {}
  };

  return (
    <ThemeCtx.Provider value={{ aesthetic, setAesthetic, navCollapsed, setNavCollapsed }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error("useTheme must be used inside ThemeProvider");
  return c;
}
