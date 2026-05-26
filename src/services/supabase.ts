// ============================================
// Supabase Client
// IslamicStack - Hadith App
// ============================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xxjbpxocmllnrpiaudnh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4amJweG9jbWxsbnJwaWF1ZG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjE1MTUsImV4cCI6MjA5NTIzNzUxNX0.t8VgNOCXIr8gVKkZVRH5hQz6-BKCTIQVLW9Ii9sHqpg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// Helper: Test connection
// ============================================
export const testConnection = async () => {
  const { data, error } = await supabase
    .from('collections')
    .select('name, arabic_name, total_hadiths')
    .order('sort_order');

  if (error) {
    console.error('Supabase connection error:', error.message);
    return null;
  }

  console.log('✅ Connected to Supabase! Collections:', data);
  return data;
};