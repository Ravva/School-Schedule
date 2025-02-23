import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type Tables = Database["public"]["Tables"];
export type TeacherRow = Tables["teachers"]["Row"];
export type SubjectRow = Tables["subjects"]["Row"];
export type TimeSlotRow = {
  id: string;
  day: string;
  lesson_id: string;
  subject: string;
  teacher_id: string;
  room: string;
  class_id: string;
  is_extracurricular?: boolean;
};
export type ClassRow = Tables["classes"]["Row"];
