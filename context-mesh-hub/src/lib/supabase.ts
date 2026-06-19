/**
 * Supabase Client — initialized with project URL and anon key.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://jjmgjnffoiwgepxqgjik.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqbWdqbmZmb2l3Z2VweHFnamlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyODkyMzcsImV4cCI6MjA5MDg2NTIzN30.esNlQWnyKStUOCNm_K3_VRNjwUKzvTVkqmeJG-DlJq0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
