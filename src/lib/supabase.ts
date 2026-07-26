import { createClient } from "@supabase/supabase-js";

// Publishable values — safe in client code. Your own Supabase project.
const SUPABASE_URL = "https://frlacgylllacvwipkwbd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybGFjZ3lsbGxhY3Z3aXBrd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNzA5MjcsImV4cCI6MjEwMDY0NjkyN30.BYR--ATVQdIuWiyq8R1Lga5w0MKSOV81Lb4AFhHm_hs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
