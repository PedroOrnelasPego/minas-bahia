// supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Se estiver usando Vite, lembre de usar VITE_ no prefixo das variáveis
const supabaseUrl = "https://ynhnvkrkydlocfmpkkfv.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluaG52a3JreWRsb2NmbXBra2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NzE2NzgsImV4cCI6MjA2MDM0NzY3OH0.0IHPELM0i581Fm-LfSkmnWwMDf413dvZA285bmjq8oA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
