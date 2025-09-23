import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://iltnubfjvyprcdujhkqi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdG51YmZqdnlwcmNkdWpoa3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDc1NDgsImV4cCI6MjA3MzgyMzU0OH0.n5j8uIghjwQiYDyzo7cpSakyMZn22QevjXK7nvV5UR0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);