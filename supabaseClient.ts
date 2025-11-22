
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓ ---
// Helper per llegir variables d'entorn de forma segura
const getEnvVar = (key: string): string | undefined => {
  // Intentar llegir de import.meta.env (Vite/Modern browsers)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta && import.meta.env) {
      // @ts-ignore
      const val = import.meta.env[key];
      if (val) return val;
    }
  } catch (e) {
    // Ignorar errors d'accés
  }

  // Intentar llegir de process.env (Node/Webpack)
  try {
    if (typeof process !== 'undefined' && process && process.env) {
      const val = process.env[key];
      if (val) return val;
    }
  } catch (e) {
     // Ignorar errors d'accés
  }

  return undefined;
};

const envUrl = getEnvVar('VITE_SUPABASE_URL');
const envKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

const defaultUrl = 'https://nqgcgkcmcttkkctqytyj.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZ2Nna2NtY3R0a2tjdHF5dHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTY5MTUsImV4cCI6MjA3ODg3MjkxNX0.IAfvWZMsKBDGPzjiaWRmNZEd9bmxop3PdhMHKF3nkj8';

const supabaseUrl = envUrl || defaultUrl;
const supabaseAnonKey = envKey || defaultKey;
// ---------------------------------

const isConfigured = supabaseUrl && supabaseAnonKey && !supabaseUrl.startsWith('REPLACE_');

const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isConfigured) {
  console.error("Les claus de Supabase no estan configurades correctament.");
}

export { supabase };
