export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      action_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "action_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability: {
        Row: {
          end_time: string
          id: string
          start_time: string
          walker_id: string
          weekday: number
        }
        Insert: {
          end_time: string
          id?: string
          start_time: string
          walker_id: string
          weekday: number
        }
        Update: {
          end_time?: string
          id?: string
          start_time?: string
          walker_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_walker_id_fkey"
            columns: ["walker_id"]
            isOneToOne: false
            referencedRelation: "walker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          status: Database["public"]["Enums"]["payment_status"]
          walk_request_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string
          status?: Database["public"]["Enums"]["payment_status"]
          walk_request_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          status?: Database["public"]["Enums"]["payment_status"]
          walk_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_walk_request_id_fkey"
            columns: ["walk_request_id"]
            isOneToOne: true
            referencedRelation: "walk_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age: number | null
          behavior: string | null
          breed: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          size: Database["public"]["Enums"]["pet_size"]
          tutor_id: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          behavior?: string | null
          breed?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          size: Database["public"]["Enums"]["pet_size"]
          tutor_id: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          behavior?: string | null
          breed?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          size?: Database["public"]["Enums"]["pet_size"]
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_admin: boolean
          roles: string[]
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          is_admin?: boolean
          roles: string[]
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_admin?: boolean
          roles?: string[]
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_logs: {
        Row: {
          chosen: boolean
          created_at: string
          factors: Json
          id: string
          rank: number
          score: number
          shown_at: string
          walk_request_id: string
          walker_id: string
        }
        Insert: {
          chosen?: boolean
          created_at?: string
          factors?: Json
          id?: string
          rank: number
          score: number
          shown_at?: string
          walk_request_id: string
          walker_id: string
        }
        Update: {
          chosen?: boolean
          created_at?: string
          factors?: Json
          id?: string
          rank?: number
          score?: number
          shown_at?: string
          walk_request_id?: string
          walker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_logs_walk_request_id_fkey"
            columns: ["walk_request_id"]
            isOneToOne: false
            referencedRelation: "walk_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_logs_walker_id_fkey"
            columns: ["walker_id"]
            isOneToOne: false
            referencedRelation: "walker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
          walk_request_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
          walk_request_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          walk_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_walk_request_id_fkey"
            columns: ["walk_request_id"]
            isOneToOne: false
            referencedRelation: "walk_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          target_id: string
          target_type: Database["public"]["Enums"]["review_target"]
          walk_request_id: string
        }
        Insert: {
          author_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          target_id: string
          target_type: Database["public"]["Enums"]["review_target"]
          walk_request_id: string
        }
        Update: {
          author_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          target_id?: string
          target_type?: Database["public"]["Enums"]["review_target"]
          walk_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_walk_request_id_fkey"
            columns: ["walk_request_id"]
            isOneToOne: false
            referencedRelation: "walk_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      walker_profiles: {
        Row: {
          accepted_behaviors: string[]
          accepted_sizes: Database["public"]["Enums"]["pet_size"][]
          active: boolean
          base_price: number
          bio: string | null
          created_at: string
          experience_years: number
          id: string
          photo_url: string | null
          service_region: string | null
          updated_at: string
        }
        Insert: {
          accepted_behaviors?: string[]
          accepted_sizes?: Database["public"]["Enums"]["pet_size"][]
          active?: boolean
          base_price?: number
          bio?: string | null
          created_at?: string
          experience_years?: number
          id: string
          photo_url?: string | null
          service_region?: string | null
          updated_at?: string
        }
        Update: {
          accepted_behaviors?: string[]
          accepted_sizes?: Database["public"]["Enums"]["pet_size"][]
          active?: boolean
          base_price?: number
          bio?: string | null
          created_at?: string
          experience_years?: number
          id?: string
          photo_url?: string | null
          service_region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "walker_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      walk_requests: {
        Row: {
          cancel_reason: string | null
          cancelled_by: string | null
          created_at: string
          duration_min: number
          id: string
          location_text: string | null
          pet_id: string
          price_estimate: number
          region: string
          scheduled_date: string
          start_time: string
          status: Database["public"]["Enums"]["walk_status"]
          tutor_id: string
          updated_at: string
          walker_id: string | null
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_by?: string | null
          created_at?: string
          duration_min: number
          id?: string
          location_text?: string | null
          pet_id: string
          price_estimate?: number
          region: string
          scheduled_date: string
          start_time: string
          status?: Database["public"]["Enums"]["walk_status"]
          tutor_id: string
          updated_at?: string
          walker_id?: string | null
        }
        Update: {
          cancel_reason?: string | null
          cancelled_by?: string | null
          created_at?: string
          duration_min?: number
          id?: string
          location_text?: string | null
          pet_id?: string
          price_estimate?: number
          region?: string
          scheduled_date?: string
          start_time?: string
          status?: Database["public"]["Enums"]["walk_status"]
          tutor_id?: string
          updated_at?: string
          walker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "walk_requests_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walk_requests_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walk_requests_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walk_requests_walker_id_fkey"
            columns: ["walker_id"]
            isOneToOne: false
            referencedRelation: "walker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      walker_ratings: {
        Row: {
          avg_rating: number | null
          review_count: number | null
          walker_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      payment_status: "pendente" | "pago"
      pet_size: "PEQUENO" | "MEDIO" | "GRANDE"
      report_status: "aberta" | "em_analise" | "resolvida"
      review_target: "walker" | "tutor" | "pet"
      walk_status: "solicitado" | "aceito" | "em_andamento" | "concluido" | "cancelado"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      payment_status: ["pendente", "pago"],
      pet_size: ["PEQUENO", "MEDIO", "GRANDE"],
      report_status: ["aberta", "em_analise", "resolvida"],
      review_target: ["walker", "tutor", "pet"],
      walk_status: ["solicitado", "aceito", "em_andamento", "concluido", "cancelado"],
    },
  },
} as const

