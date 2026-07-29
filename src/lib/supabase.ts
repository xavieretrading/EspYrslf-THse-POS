import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://aziowvhzfrmtrbypiodm.supabase.co';
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aW93dmh6ZnJtdHJieXBpb2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTQzMTgsImV4cCI6MjEwMDE5MDMxOH0.cCyA0z20cRfGotnzcatm-9AgZRXR0UEyW7SjGBo-HqQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
