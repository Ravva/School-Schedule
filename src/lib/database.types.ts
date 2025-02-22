export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      academic_periods: {
        Row: {
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          start_date: string
        }
        Insert: {
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          start_date: string
        }
        Update: {
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string
          grade: number
          id: string
          literal: string
          name: string
          room_id: string | null
          supervisor_teacher_id: string
        }
        Insert: {
          created_at?: string
          grade: number
          id?: string
          literal: string
          name: string
          room_id?: string | null
          supervisor_teacher_id: string
        }
        Update: {
          created_at?: string
          grade?: number
          id?: string
          literal?: string
          name?: string
          room_id?: string | null
          supervisor_teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_supervisor_teacher_id_fkey"
            columns: ["supervisor_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          end_time: string
          id: string
          lesson_number: number
          start_time: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          lesson_number: number
          start_time: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          lesson_number?: number
          start_time?: string
        }
        Relationships: []
      }
      room_subjects: {
        Row: {
          room_id: string
          subject_id: string
        }
        Insert: {
          room_id: string
          subject_id: string
        }
        Update: {
          room_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_subjects_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          room_number: string
          subject_id: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id?: string
          room_number: string
          subject_id?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          room_number?: string
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_conflicts: {
        Row: {
          conflict_type: string
          created_at: string | null
          id: string
          time_slot_1_id: string | null
          time_slot_2_id: string | null
        }
        Insert: {
          conflict_type: string
          created_at?: string | null
          id?: string
          time_slot_1_id?: string | null
          time_slot_2_id?: string | null
        }
        Update: {
          conflict_type?: string
          created_at?: string | null
          id?: string
          time_slot_1_id?: string | null
          time_slot_2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_conflicts_time_slot_1_id_fkey"
            columns: ["time_slot_1_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_conflicts_time_slot_2_id_fkey"
            columns: ["time_slot_2_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_teachers: {
        Row: {
          class_id: string | null
          created_at: string | null
          id: string
          subject_id: string | null
          teacher_id: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          id?: string
          subject_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          id?: string
          subject_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subject_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_teachers_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          is_extracurricular: boolean | null
          is_subgroup: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_extracurricular?: boolean | null
          is_subgroup?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_extracurricular?: boolean | null
          is_subgroup?: boolean | null
          name?: string
        }
        Relationships: []
      }
      syllabus: {
        Row: {
          amount_of_academic_hours_per_week: number | null
          class_id: string | null
          id: string
          subject_id: string | null
          teacher_id: string | null
        }
        Insert: {
          amount_of_academic_hours_per_week?: number | null
          class_id?: string | null
          id?: string
          subject_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          amount_of_academic_hours_per_week?: number | null
          class_id?: string | null
          id?: string
          subject_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          id: string
          is_part_time: boolean | null
          name: string
          subjects: string[] | null
          supervised_classes: string[] | null
          work_days: string[] | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_part_time?: boolean | null
          name: string
          subjects?: string[] | null
          supervised_classes?: string[] | null
          work_days?: string[] | null
        }
        Update: {
          created_at?: string
          id?: string
          is_part_time?: boolean | null
          name?: string
          subjects?: string[] | null
          supervised_classes?: string[] | null
          work_days?: string[] | null
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          class_id: string | null
          created_at: string | null
          day: string
          id: string
          is_extracurricular: boolean | null
          lesson_id: string | null
          room_id: string | null
          subject: string | null
          teacher_id: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          day: string
          id?: string
          is_extracurricular?: boolean | null
          lesson_id?: string | null
          room_id?: string | null
          subject?: string | null
          teacher_id?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          day?: string
          id?: string
          is_extracurricular?: boolean | null
          lesson_id?: string | null
          room_id?: string | null
          subject?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_slots_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_slots_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_slots_subject_fkey"
            columns: ["subject"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "time_slots_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_table_structure: {
        Args: {
          table_name: string
        }
        Returns: {
          column_name: string
          data_type: string
        }[]
      }
    }
    Enums: {
      day_of_week: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
