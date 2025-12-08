// supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Usar variables de entorno de Expo
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://rtwcoftbxtqnpheakuuu.supabase.co";

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2NvZnRieHRxbnBoZWFrdXV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjU0NTkyMywiZXhwIjoyMDY4MTIxOTIzfQ.4qNCzAjJ99W6tFz-YlLAWp7ZD9yAgPBFrpDix3D-C34";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
