import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'azubi' | 'ausbilder';
          company: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: 'azubi' | 'ausbilder';
          company?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'azubi' | 'ausbilder';
          company?: string | null;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          user_id: string;
          week_year: number;
          week_number: number;
          status: 'draft' | 'submitted' | 'approved' | 'rejected';
          submitted_at: string | null;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_year: number;
          week_number: number;
          status?: 'draft' | 'submitted' | 'approved' | 'rejected';
          submitted_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_year?: number;
          week_number?: number;
          status?: 'draft' | 'submitted' | 'approved' | 'rejected';
          submitted_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          report_id: string;
          day_of_week: number;
          date: string;
          activity_text: string;
          hours: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          day_of_week: number;
          date: string;
          activity_text: string;
          hours?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          day_of_week?: number;
          date?: string;
          activity_text?: string;
          hours?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      predefined_activities: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          created_at?: string;
        };
      };
    };
  };
};