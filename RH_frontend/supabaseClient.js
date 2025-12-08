// supabaseClient.js
import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./src/config/api";

export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey
);
