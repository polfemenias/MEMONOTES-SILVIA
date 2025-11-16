import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓ OBLIGATÒRIA ---
// Reemplaça aquests valors amb les teves claus de Supabase.
// Pots trobar-les al teu panell de Supabase a: Settings > API.
const supabaseUrl = 'https://nqgcgkcmcttkkctqytyj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZ2Nna2NtY3R0a2tjdHF5dHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTY5MTUsImV4cCI6MjA3ODg3MjkxNX0.IAfvWZMsKBDGPzjiaWRmNZEd9bmxop3PdhMHKF3nkj8';
// ---------------------------------

const isConfigured = !supabaseUrl.startsWith('REPLACE_');

const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isConfigured) {
  console.error("Les claus de Supabase no estan configurades al fitxer supabaseClient.ts. L'aplicació no funcionarà.");
}

export { supabase };