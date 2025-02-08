import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type Tables = Database["public"]["Tables"];
export type TeacherRow = Tables["teachers"]["Row"];
export type SubjectRow = Tables["subjects"]["Row"];
export type TimeSlotRow = Tables["time_slots"]["Row"];
export type ClassRow = Tables["classes"]["Row"];
