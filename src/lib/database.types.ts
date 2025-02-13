export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      classes: {
        Row: {
          id: string;
          name: string;
          grade: number;
          section: string;
          capacity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          grade: number;
          section: string;
          capacity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          grade?: number;
          section?: string;
          capacity?: number;
          created_at?: string;
        };
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          is_extracurricular: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          is_extracurricular?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          is_extracurricular?: boolean;
        };
      };
      teachers: {
        Row: {
          id: string;
          name: string;
          subjects: string[];
          supervised_classes: string[];
          created_at: string;
          is_part_time: boolean;
          work_days: string[];
        };
        Insert: {
          id?: string;
          name: string;
          subjects?: string[];
          supervised_classes?: string[];
          created_at?: string;
          is_part_time?: boolean;
          work_days?: string[];
        };
        Update: {
          id?: string;
          name?: string;
          subjects?: string[];
          supervised_classes?: string[];
          created_at?: string;
          is_part_time?: boolean;
          work_days?: string[];
        };
      };

      time_slots: {
        Row: {
          id: string;
          day: string;
          start_time: string;
          end_time: string;
          subject: string;
          teacher_id: string;
          room: string;
          is_extracurricular: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          day: string;
          start_time: string;
          end_time: string;
          subject: string;
          teacher_id: string;
          room: string;
          is_extracurricular?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          day?: string;
          start_time?: string;
          end_time?: string;
          subject?: string;
          teacher_id?: string;
          room?: string;
          is_extracurricular?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
