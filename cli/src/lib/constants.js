/**
 * Lumbung Kode — CLI Public Constants
 *
 * CATATAN KEAMANAN:
 * Supabase Anon Key adalah PUBLIC key yang memang dirancang untuk diekspos
 * di client-side (web app bundle, CLI tool, mobile app, dll).
 * Key ini BUKAN service key / admin key.
 * Keamanan data dijaga oleh Row Level Security (RLS) di level Supabase.
 *
 * Gemini API Key di sini adalah key milik project Lumbung Kode yang sengaja
 * di-bundle agar pengguna CLI tidak perlu konfigurasi apapun (plug & play).
 * Key ini digunakan HANYA untuk fitur AI Quality Gate (validasi konten push).
 * Pengguna tetap bisa override dengan key mereka sendiri via:
 *   - env variable GEMINI_API_KEY
 *   - lumbung config set-ai-key <KEY>
 *
 * Referensi:
 * https://supabase.com/docs/guides/api/api-keys#anon-public
 */

// URL project Supabase Lumbung Kode
export const SUPABASE_URL = 'https://xwaxnszxtgelllkstrcd.supabase.co'

// Public Anon Key — aman untuk diekspos di client (dijaga oleh RLS)
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3YXhuc3p4dGdlbGxsa3N0cmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTMwODUsImV4cCI6MjA4MDI2OTA4NX0.8rivgwRpax9X3OuR9qKX27y8-9CWcigZn0IGObKXU6o'

// Gemini API Key — di-bundle untuk fitur AI Quality Gate (plug & play)
// Pengguna bisa override via env GEMINI_API_KEY atau lumbung config set-ai-key
export const GEMINI_API_KEY = 'AIzaSyC0zpItOIF4dG_45qOQhgVtGVrQ40f2MTQ'
