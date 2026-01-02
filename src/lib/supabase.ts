import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'staff';
  created_at: string;
  updated_at: string;
};

export type Procedure = {
  id: string;
  title: string;
  description: string;
  source: string;
  source_link: string;
  effective_date: string;
  status: 'active' | 'archived' | 'replaced';
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Acknowledgment = {
  id: string;
  procedure_id: string;
  user_id: string;
  acknowledged_at: string;
};
