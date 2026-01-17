export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blocked_devices: {
        Row: {
          blocked_at: string
          device_fingerprint: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          reason: string
          telegram_id: string | null
        }
        Insert: {
          blocked_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          reason: string
          telegram_id?: string | null
        }
        Update: {
          blocked_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          reason?: string
          telegram_id?: string | null
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          created_at: string
          id: string
          profile_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          profile_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_claims: {
        Row: {
          bonus_amount: number
          claimed_at: string
          id: string
          milestone_count: number
          profile_id: string
        }
        Insert: {
          bonus_amount: number
          claimed_at?: string
          id?: string
          milestone_count: number
          profile_id: string
        }
        Update: {
          bonus_amount?: number
          claimed_at?: string
          id?: string
          milestone_count?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_claims_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_ips: {
        Row: {
          first_seen_at: string
          id: string
          ip_address: string
          last_seen_at: string
          profile_id: string
        }
        Insert: {
          first_seen_at?: string
          id?: string
          ip_address: string
          last_seen_at?: string
          profile_id: string
        }
        Update: {
          first_seen_at?: string
          id?: string
          ip_address?: string
          last_seen_at?: string
          profile_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number
          block_reason: string | null
          created_at: string
          device_fingerprint: string | null
          id: string
          is_suspicious: boolean | null
          nickname: string
          phone_number: string | null
          referral_code: string
          referrer_id: string | null
          registration_ip: string | null
          telegram_id: string | null
          total_earned: number
          updated_at: string
          user_id: string | null
          vip_level: number
          withdrawal_blocked: boolean | null
        }
        Insert: {
          balance?: number
          block_reason?: string | null
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          is_suspicious?: boolean | null
          nickname: string
          phone_number?: string | null
          referral_code?: string
          referrer_id?: string | null
          registration_ip?: string | null
          telegram_id?: string | null
          total_earned?: number
          updated_at?: string
          user_id?: string | null
          vip_level?: number
          withdrawal_blocked?: boolean | null
        }
        Update: {
          balance?: number
          block_reason?: string | null
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          is_suspicious?: boolean | null
          nickname?: string
          phone_number?: string | null
          referral_code?: string
          referrer_id?: string | null
          registration_ip?: string | null
          telegram_id?: string | null
          total_earned?: number
          updated_at?: string
          user_id?: string | null
          vip_level?: number
          withdrawal_blocked?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          reward_amount: number
          reward_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          reward_amount: number
          reward_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          reward_amount?: number
          reward_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_attempts: {
        Row: {
          attempted_at: string
          block_reason: string | null
          device_fingerprint: string | null
          id: string
          ip_address: string
          was_blocked: boolean | null
        }
        Insert: {
          attempted_at?: string
          block_reason?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_address: string
          was_blocked?: boolean | null
        }
        Update: {
          attempted_at?: string
          block_reason?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_address?: string
          was_blocked?: boolean | null
        }
        Relationships: []
      }
      suspicious_wallets: {
        Row: {
          first_seen_profile_id: string
          flagged_at: string
          id: string
          is_active: boolean | null
          usdt_address: string
        }
        Insert: {
          first_seen_profile_id: string
          flagged_at?: string
          id?: string
          is_active?: boolean | null
          usdt_address: string
        }
        Update: {
          first_seen_profile_id?: string
          flagged_at?: string
          id?: string
          is_active?: boolean | null
          usdt_address?: string
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          completed_at: string
          id: string
          profile_id: string
          reward_amount: number
          task_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          profile_id: string
          reward_amount: number
          task_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          profile_id?: string
          reward_amount?: number
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_purchases: {
        Row: {
          amount: number
          id: string
          profile_id: string
          purchased_at: string
          vip_level: number
        }
        Insert: {
          amount: number
          id?: string
          profile_id: string
          purchased_at?: string
          vip_level: number
        }
        Update: {
          amount?: number
          id?: string
          profile_id?: string
          purchased_at?: string
          vip_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "vip_purchases_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          profile_id: string
          status: string
          usdt_address: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          profile_id: string
          status?: string
          usdt_address: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          profile_id?: string
          status?: string
          usdt_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_profile_id_fkey"
            columns: ["profile_id"]
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
      check_milestone_bonuses: {
        Args: { p_referrer_id: string }
        Returns: undefined
      }
      check_registration_allowed: {
        Args: {
          p_device_fingerprint: string
          p_ip_address: string
          p_telegram_id?: string
        }
        Returns: Json
      }
      check_registration_allowed_v2: {
        Args: {
          p_device_fingerprint: string
          p_ip_address: string
          p_phone_number?: string
          p_telegram_id?: string
        }
        Returns: Json
      }
      check_withdrawal_allowed: {
        Args: { p_profile_id: string; p_usdt_address: string }
        Returns: Json
      }
      get_referral_reward: { Args: { p_vip_level: number }; Returns: number }
      get_referrer_by_code: { Args: { p_code: string }; Returns: string }
      get_task_commission_rate: {
        Args: { p_vip_level: number }
        Returns: number
      }
      log_profile_ip: {
        Args: { p_ip_address: string; p_profile_id: string }
        Returns: undefined
      }
      log_registration_attempt: {
        Args: {
          p_block_reason?: string
          p_device_fingerprint: string
          p_ip_address: string
          p_was_blocked?: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
