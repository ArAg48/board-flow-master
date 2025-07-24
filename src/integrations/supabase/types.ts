export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      board_data: {
        Row: {
          assembly_number: string
          board_type: string
          created_at: string
          hardware_order_id: string | null
          id: string
          ptl_order_id: string | null
          qr_code: string
          sequence_number: string
          technician_id: string | null
          test_date: string | null
          test_results: Json | null
          test_status: string | null
          updated_at: string
        }
        Insert: {
          assembly_number: string
          board_type: string
          created_at?: string
          hardware_order_id?: string | null
          id?: string
          ptl_order_id?: string | null
          qr_code: string
          sequence_number: string
          technician_id?: string | null
          test_date?: string | null
          test_results?: Json | null
          test_status?: string | null
          updated_at?: string
        }
        Update: {
          assembly_number?: string
          board_type?: string
          created_at?: string
          hardware_order_id?: string | null
          id?: string
          ptl_order_id?: string | null
          qr_code?: string
          sequence_number?: string
          technician_id?: string | null
          test_date?: string | null
          test_results?: Json | null
          test_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_data_hardware_order_id_fkey"
            columns: ["hardware_order_id"]
            isOneToOne: false
            referencedRelation: "hardware_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_data_ptl_order_id_fkey"
            columns: ["ptl_order_id"]
            isOneToOne: false
            referencedRelation: "ptl_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_data_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware_orders: {
        Row: {
          assembly_number: string
          created_at: string
          created_by: string | null
          ending_sequence: string | null
          id: string
          notes: string | null
          po_number: string
          quantity: number
          starting_sequence: string
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          assembly_number?: string
          created_at?: string
          created_by?: string | null
          ending_sequence?: string | null
          id?: string
          notes?: string | null
          po_number?: string
          quantity?: number
          starting_sequence?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          assembly_number?: string
          created_at?: string
          created_by?: string | null
          ending_sequence?: string | null
          id?: string
          notes?: string | null
          po_number?: string
          quantity?: number
          starting_sequence?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hardware_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          password: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          password?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          password?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      ptl_orders: {
        Row: {
          board_type: string
          created_at: string
          created_by: string | null
          hardware_order_id: string | null
          id: string
          ptl_order_number: string
          quantity: number
          status: Database["public"]["Enums"]["order_status"]
          test_parameters: Json | null
          updated_at: string
        }
        Insert: {
          board_type: string
          created_at?: string
          created_by?: string | null
          hardware_order_id?: string | null
          id?: string
          ptl_order_number: string
          quantity: number
          status?: Database["public"]["Enums"]["order_status"]
          test_parameters?: Json | null
          updated_at?: string
        }
        Update: {
          board_type?: string
          created_at?: string
          created_by?: string | null
          hardware_order_id?: string | null
          id?: string
          ptl_order_number?: string
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          test_parameters?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ptl_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ptl_orders_hardware_order_id_fkey"
            columns: ["hardware_order_id"]
            isOneToOne: false
            referencedRelation: "hardware_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_entries: {
        Row: {
          assigned_technician_id: string | null
          board_type: string
          created_at: string
          failure_date: string
          failure_reason: string
          id: string
          original_session_id: string
          ptl_order_id: string
          qr_code: string
          repair_completed_date: string | null
          repair_notes: string | null
          repair_start_date: string | null
          repair_status: Database["public"]["Enums"]["repair_status"]
          retest_results: Database["public"]["Enums"]["retest_result"] | null
          updated_at: string
        }
        Insert: {
          assigned_technician_id?: string | null
          board_type: string
          created_at?: string
          failure_date: string
          failure_reason: string
          id?: string
          original_session_id: string
          ptl_order_id: string
          qr_code: string
          repair_completed_date?: string | null
          repair_notes?: string | null
          repair_start_date?: string | null
          repair_status?: Database["public"]["Enums"]["repair_status"]
          retest_results?: Database["public"]["Enums"]["retest_result"] | null
          updated_at?: string
        }
        Update: {
          assigned_technician_id?: string | null
          board_type?: string
          created_at?: string
          failure_date?: string
          failure_reason?: string
          id?: string
          original_session_id?: string
          ptl_order_id?: string
          qr_code?: string
          repair_completed_date?: string | null
          repair_notes?: string | null
          repair_start_date?: string | null
          repair_status?: Database["public"]["Enums"]["repair_status"]
          retest_results?: Database["public"]["Enums"]["retest_result"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_entries_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_entries_original_session_id_fkey"
            columns: ["original_session_id"]
            isOneToOne: false
            referencedRelation: "scan_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_entries_ptl_order_id_fkey"
            columns: ["ptl_order_id"]
            isOneToOne: false
            referencedRelation: "ptl_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          end_time: string | null
          fail_count: number
          id: string
          notes: string | null
          pass_count: number
          pass_rate: number | null
          ptl_order_id: string
          start_time: string
          status: Database["public"]["Enums"]["session_status"]
          technician_id: string
          tester_config: Json
          total_scanned: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          fail_count?: number
          id?: string
          notes?: string | null
          pass_count?: number
          pass_rate?: number | null
          ptl_order_id: string
          start_time?: string
          status?: Database["public"]["Enums"]["session_status"]
          technician_id: string
          tester_config: Json
          total_scanned?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          fail_count?: number
          id?: string
          notes?: string | null
          pass_count?: number
          pass_rate?: number | null
          ptl_order_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["session_status"]
          technician_id?: string
          tester_config?: Json
          total_scanned?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_sessions_ptl_order_id_fkey"
            columns: ["ptl_order_id"]
            isOneToOne: false
            referencedRelation: "ptl_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_sessions_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_user: {
        Args: { input_username: string; input_password: string }
        Returns: {
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      create_user_account: {
        Args: {
          p_username: string
          p_password: string
          p_first_name: string
          p_last_name: string
          p_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      order_status: "pending" | "in_progress" | "completed" | "cancelled"
      repair_status: "pending" | "in_progress" | "completed" | "scrapped"
      retest_result: "pass" | "fail"
      session_status: "completed" | "paused" | "abandoned" | "active"
      user_role: "manager" | "technician"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      order_status: ["pending", "in_progress", "completed", "cancelled"],
      repair_status: ["pending", "in_progress", "completed", "scrapped"],
      retest_result: ["pass", "fail"],
      session_status: ["completed", "paused", "abandoned", "active"],
      user_role: ["manager", "technician"],
    },
  },
} as const
