import { createFileRoute } from "@tanstack/react-router";
import { User as UserIcon, LogIn, LogOut, Mail, Save, Upload } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — AltCam" },
      { name: "description", content: "Sign in to sync your AltCam photos and journal pages." },
      { property: "og:title", content: "Profile — AltCam" },
      { property: "og:description", content: "Sign in to sync your AltCam photos and journal pages." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-10 py-8 md:py-12">
      <header className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          <UserIcon className="h-3.5 w-3.5" /> Profile
        </div>
        <h1 className="font-display text-4xl md:text-6xl leading-[0.95] text-foreground">
          {user ? "You're in." : "Sign in."}
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl">
          {user
            ? "Your photos and journal pages will sync to your own Supabase project."
            : "Auth runs on your own Supabase project. Nothing goes through Lovable's servers."}
        </p>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        {user ? (
          <>
            <ProfileEditor userId={user.id} />
            <SignedIn email={user.email ?? ""} onSignOut={signOut} />
          </>
        ) : (
          <SignedOut />
        )}
      </div>
    </div>
  );
}

function ProfileEditor({ userId }: { userId: string }) {
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [tableMissing, setTableMissing] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_path")
        .eq("id", userId)
        .maybeSingle();
      if (error) {
        // 42P01 = undefined_table
        if ((error as { code?: string }).code === "42P01" || /profiles.*does not exist/i.test(error.message)) {
          setTableMissing(true);
          return;
        }
        setMsg({ kind: "error", text: error.message });
        return;
      }
      if (data) {
        setDisplayName(data.display_name ?? "");
        if (data.avatar_path) {
          const { data: signed } = await supabase.storage.from("photos").createSignedUrl(data.avatar_path, 3600);
          setAvatarUrl(signed?.signedUrl ?? null);
        }
      }
    })();
  }, [userId]);

  const onAvatarPick = (file: File | null | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    (window as unknown as { __altcamAvatarFile?: File }).__altcamAvatarFile = file;
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      let avatar_path: string | undefined;
      const file = (window as unknown as { __altcamAvatarFile?: File }).__altcamAvatarFile;
      if (file) {
        const path = `${userId}/avatar/${Date.now()}-${file.name.replace(/[^a-z0-9.\-]/gi, "_")}`;
        const { error: upErr } = await supabase.storage.from("photos").upload(path, file, {
          contentType: file.type || "image/png",
          upsert: false,
        });
        if (upErr) throw upErr;
        avatar_path = path;
      }
      const payload: Record<string, unknown> = { id: userId, display_name: displayName || null };
      if (avatar_path) payload.avatar_path = avatar_path;
      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
      if (error) throw error;
      setMsg({ kind: "info", text: "Profile saved." });
      if (avatar_path) {
        const { data: signed } = await supabase.storage.from("photos").createSignedUrl(avatar_path, 3600);
        setAvatarUrl(signed?.signedUrl ?? null);
        setAvatarPreview(null);
        delete (window as unknown as { __altcamAvatarFile?: File }).__altcamAvatarFile;
      }
    } catch (err) {
      setMsg({ kind: "error", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setBusy(false);
    }
  };

  if (tableMissing) {
    return (
      <div className="border border-dashed border-border bg-card p-4 rounded-lg text-xs text-muted-foreground">
        Run the <code className="text-foreground">profiles</code> table SQL in your Supabase dashboard (see chat) to enable display name and avatar.
      </div>
    );
  }

  const shownAvatar = avatarPreview ?? avatarUrl;

  return (
    <form onSubmit={save} className="border border-border bg-card p-6 rounded-lg space-y-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Your profile</div>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center">
          {shownAvatar ? (
            <img src={shownAvatar} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <UserIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm border border-input bg-background rounded-md hover:bg-accent">
          <Upload className="h-4 w-4" /> Choose avatar
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onAvatarPick(e.target.files?.[0])}
          />
        </label>
      </div>
      <div>
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Display name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={60}
          placeholder="What should we call you?"
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        <Save className="h-4 w-4" /> {busy ? "Saving…" : "Save profile"}
      </button>
      {msg && (
        <div
          className={`text-xs p-3 rounded-md ${
            msg.kind === "error"
              ? "bg-destructive/10 text-destructive border border-destructive/30"
              : "bg-primary/10 text-foreground border border-primary/30"
          }`}
        >
          {msg.text}
        </div>
      )}
    </form>
  );
}

function SignedIn({ email, onSignOut }: { email: string; onSignOut: () => Promise<void> }) {
  return (
    <div className="border border-border bg-card p-6 rounded-lg space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Signed in as</div>
          <div className="text-sm font-medium text-foreground">{email}</div>
        </div>
      </div>
      <button
        onClick={onSignOut}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}

function SignedOut() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/profile" },
        });
        if (error) throw error;
        setMsg({ kind: "info", text: "Check your email to confirm your account." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMsg({ kind: "error", text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/profile" },
    });
    if (error) {
      setMsg({ kind: "error", text: error.message });
      setBusy(false);
    }
  };

  return (
    <div className="border border-border bg-card p-6 rounded-lg space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setMode("signin")}
          className={`flex-1 text-sm py-2 rounded-md transition-colors ${
            mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign in
        </button>
        <button
          onClick={() => setMode("signup")}
          className={`flex-1 text-sm py-2 rounded-md transition-colors ${
            mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <LogIn className="h-4 w-4" /> {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
          <span className="bg-card px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <button
        onClick={google}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
        </svg>
        Continue with Google
      </button>

      {msg && (
        <div
          className={`text-xs p-3 rounded-md ${
            msg.kind === "error"
              ? "bg-destructive/10 text-destructive border border-destructive/30"
              : "bg-primary/10 text-foreground border border-primary/30"
          }`}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}
