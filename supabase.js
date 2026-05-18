const SUPABASE_URL = "https://cigybkrnonnvgidcdrqz.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZ3lia3Jub25udmdpZGNkcnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTc5MzUsImV4cCI6MjA5NDY5MzkzNX0.GyYTS5tJSEU2Gp-zkeobKQsB4mJlBZLoXtuSWmHMuGw";

window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);