// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://okgfltlneqjglfgqwigw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rZ2ZsdGxuZXFqZ2xmZ3F3aWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyOTAyNzQsImV4cCI6MjA0Mjg2NjI3NH0.hJ6XkzyPcRy6fl_S1Rx4xbjYrfezPVV15fqwJDepGog';
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
