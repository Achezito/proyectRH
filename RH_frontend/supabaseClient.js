// supabaseClient.js - PARA TESTING
import { createClient } from "@supabase/supabase-js";

// URLs de ejemplo (REMPLAZA CON LAS TUS)
const SUPABASE_URL = "https://rtwcoftbxtqnpheakuuu.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2NvZnRieHRxbnBoZWFrdXV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjU0NTkyMywiZXhwIjoyMDY4MTIxOTIzfQ.4qNCzAjJ99W6tFz-YlLAWp7ZD9yAgPBFrpDix3D-C34";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
