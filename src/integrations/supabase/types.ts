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
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          company_email: string
          company_name: string
          created_at: string
          enquiry_details: string
          id: string
          person_name: string
          position: string
        }
        Insert: {
          company_email: string
          company_name: string
          created_at?: string
          enquiry_details: string
          id?: string
          person_name: string
          position: string
        }
        Update: {
          company_email?: string
          company_name?: string
          created_at?: string
          enquiry_details?: string
          id?: string
          person_name?: string
          position?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_line1: string
          address_line2: string | null
          amount: number
          city: string
          created_at: string
          customer_email: string
          customer_name: string
          format: string
          id: string
          order_reference: string
          order_status: string
          payment_status: string
          postcode: string
          product_name: string
          shipping_cost: number
          shipping_method: string
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          amount: number
          city: string
          created_at?: string
          customer_email: string
          customer_name: string
          format: string
          id?: string
          order_reference?: string
          order_status?: string
          payment_status?: string
          postcode: string
          product_name: string
          shipping_cost: number
          shipping_method: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          amount?: number
          city?: string
          created_at?: string
          customer_email?: string
          customer_name?: string
          format?: string
          id?: string
          order_reference?: string
          order_status?: string
          payment_status?: string
          postcode?: string
          product_name?: string
          shipping_cost?: number
          shipping_method?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_name: string | null
          category_id: string | null
          content: string
          created_at: string
          id: string
          likes_count: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          category_id?: string | null
          content: string
          created_at?: string
          id?: string
          likes_count?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          category_id?: string | null
          content?: string
          created_at?: string
          id?: string
          likes_count?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_results: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          report_url: string | null
          status: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id: string
          report_url?: string | null
          status?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          report_url?: string | null
          status?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      scans: {
        Row: {
          created_at: string | null
          id: string
          scan_type: string
          status: string
          updated_at: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          scan_type: string
          status?: string
          updated_at?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          scan_type?: string
          status?: string
          updated_at?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          api_key: string | null
          created_at: string | null
          email: string
          id: string
          is_approved: boolean | null
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string | null
          email: string
          id: string
          is_approved?: boolean | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_approved?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          email_verified: boolean | null
          id: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          id?: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          id?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      vulnerabilities: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          scan_id: string | null
          severity: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          scan_id?: string | null
          severity: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          scan_id?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "vulnerabilities_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      vulnerability_scans: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          progress: number
          report_path: string | null
          site_url: string
          status: string
          summary: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          report_path?: string | null
          site_url: string
          status?: string
          summary?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          report_path?: string | null
          site_url?: string
          status?: string
          summary?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
