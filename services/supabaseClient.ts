import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gbserttznudebfwivvwb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdic2VydHR6bnVkZWJmd2l2dndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDE4MjQsImV4cCI6MjA4OTIxNzgyNH0.GqC1nVbA9_rqdrYasiT59xd3kwxj1vwj-0McTUrE8XU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
