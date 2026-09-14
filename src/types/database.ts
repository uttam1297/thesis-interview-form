export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      consents: {
        Row: {
          consent_version: string;
          consented_at: string;
          id: string;
          participant_id: string;
          participation_consent: boolean;
          recorded_by: string | null;
          recording_consent: boolean | null;
          session_id: string;
          withdrawal_note: string | null;
          withdrawn_at: string | null;
        };
        Insert: {
          consent_version: string;
          consented_at?: string;
          id?: string;
          participant_id: string;
          participation_consent: boolean;
          recorded_by?: string | null;
          recording_consent?: boolean | null;
          session_id: string;
          withdrawal_note?: string | null;
          withdrawn_at?: string | null;
        };
        Update: {
          consent_version?: string;
          consented_at?: string;
          id?: string;
          participant_id?: string;
          participation_consent?: boolean;
          recorded_by?: string | null;
          recording_consent?: boolean | null;
          session_id?: string;
          withdrawal_note?: string | null;
          withdrawn_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "consents_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "participants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "consents_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      interview_v2_consents: {
        Row: {
          consent_version: string;
          consented_at: string;
          id: string;
          participant_code: string;
          participation_consent: boolean;
          questionnaire_version: string;
          recorded_by: string | null;
          recording_consent: boolean | null;
          session_id: string;
          withdrawal_note: string | null;
          withdrawn_at: string | null;
        };
        Insert: {
          consent_version: string;
          consented_at?: string;
          id?: string;
          participant_code: string;
          participation_consent: boolean;
          questionnaire_version?: string;
          recorded_by?: string | null;
          recording_consent?: boolean | null;
          session_id: string;
          withdrawal_note?: string | null;
          withdrawn_at?: string | null;
        };
        Update: {
          consent_version?: string;
          consented_at?: string;
          id?: string;
          participant_code?: string;
          participation_consent?: boolean;
          questionnaire_version?: string;
          recorded_by?: string | null;
          recording_consent?: boolean | null;
          session_id?: string;
          withdrawal_note?: string | null;
          withdrawn_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "interview_v2_consents_session_id_participant_code_fkey";
            columns: ["session_id", "participant_code"];
            isOneToOne: false;
            referencedRelation: "interview_v2_sessions";
            referencedColumns: ["id", "participant_code"];
          },
        ];
      };
      interview_v2_questionnaire_versions: {
        Row: {
          definition: Json;
          definition_hash: string;
          id: string;
          published_at: string;
          questionnaire_version: string;
          study_id: string;
        };
        Insert: {
          definition: Json;
          definition_hash: string;
          id?: string;
          published_at?: string;
          questionnaire_version: string;
          study_id: string;
        };
        Update: {
          definition?: Json;
          definition_hash?: string;
          id?: string;
          published_at?: string;
          questionnaire_version?: string;
          study_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interview_v2_questionnaire_versions_study_id_fkey";
            columns: ["study_id"];
            isOneToOne: false;
            referencedRelation: "studies";
            referencedColumns: ["id"];
          },
        ];
      };
      interview_v2_questions: {
        Row: {
          constructs: string[];
          definition: Json;
          id: string;
          position: number;
          question_id: string;
          question_version: string;
          questionnaire_version_id: string;
          response_type: string;
          section: string;
        };
        Insert: {
          constructs: string[];
          definition: Json;
          id?: string;
          position: number;
          question_id: string;
          question_version?: string;
          questionnaire_version_id: string;
          response_type: string;
          section: string;
        };
        Update: {
          constructs?: string[];
          definition?: Json;
          id?: string;
          position?: number;
          question_id?: string;
          question_version?: string;
          questionnaire_version_id?: string;
          response_type?: string;
          section?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interview_v2_questions_questionnaire_version_id_fkey";
            columns: ["questionnaire_version_id"];
            isOneToOne: false;
            referencedRelation: "interview_v2_questionnaire_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      interview_v2_responses: {
        Row: {
          constructs: string[];
          created_at: string;
          method: Database["public"]["Enums"]["response_method"];
          optional_elaboration: string | null;
          participant_code: string;
          question_definition_id: string;
          question_id: string;
          question_version: string;
          questionnaire_version: string;
          response_id: string;
          response_type: string;
          response_value: Json | null;
          section: string;
          session_id: string;
          skipped: boolean;
          text_value: string | null;
          updated_at: string;
        };
        Insert: {
          constructs: string[];
          created_at?: string;
          method: Database["public"]["Enums"]["response_method"];
          optional_elaboration?: string | null;
          participant_code: string;
          question_definition_id: string;
          question_id: string;
          question_version: string;
          questionnaire_version?: string;
          response_id?: string;
          response_type: string;
          response_value?: Json | null;
          section: string;
          session_id: string;
          skipped?: boolean;
          text_value?: string | null;
          updated_at?: string;
        };
        Update: {
          constructs?: string[];
          created_at?: string;
          method?: Database["public"]["Enums"]["response_method"];
          optional_elaboration?: string | null;
          participant_code?: string;
          question_definition_id?: string;
          question_id?: string;
          question_version?: string;
          questionnaire_version?: string;
          response_id?: string;
          response_type?: string;
          response_value?: Json | null;
          section?: string;
          session_id?: string;
          skipped?: boolean;
          text_value?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interview_v2_responses_question_definition_id_fkey";
            columns: ["question_definition_id"];
            isOneToOne: false;
            referencedRelation: "interview_v2_questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interview_v2_responses_session_id_participant_code_fkey";
            columns: ["session_id", "participant_code"];
            isOneToOne: false;
            referencedRelation: "interview_v2_sessions";
            referencedColumns: ["id", "participant_code"];
          },
        ];
      };
      interview_v2_sessions: {
        Row: {
          completed_at: string | null;
          created_by: string | null;
          current_step_id: string;
          id: string;
          last_activity_at: string;
          participant_code: string;
          questionnaire_version: string;
          questionnaire_version_id: string;
          researcher_notes: string | null;
          response_mode: Database["public"]["Enums"]["response_mode"];
          resume_expires_at: string;
          resume_token_hash: string;
          return_to_review: boolean;
          started_at: string;
          status: Database["public"]["Enums"]["session_status"];
          study_id: string;
          study_stage: string;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          created_by?: string | null;
          current_step_id?: string;
          id?: string;
          last_activity_at?: string;
          participant_code: string;
          questionnaire_version?: string;
          questionnaire_version_id: string;
          researcher_notes?: string | null;
          response_mode?: Database["public"]["Enums"]["response_mode"];
          resume_expires_at?: string;
          resume_token_hash: string;
          return_to_review?: boolean;
          started_at?: string;
          status?: Database["public"]["Enums"]["session_status"];
          study_id: string;
          study_stage?: string;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          created_by?: string | null;
          current_step_id?: string;
          id?: string;
          last_activity_at?: string;
          participant_code?: string;
          questionnaire_version?: string;
          questionnaire_version_id?: string;
          researcher_notes?: string | null;
          response_mode?: Database["public"]["Enums"]["response_mode"];
          resume_expires_at?: string;
          resume_token_hash?: string;
          return_to_review?: boolean;
          started_at?: string;
          status?: Database["public"]["Enums"]["session_status"];
          study_id?: string;
          study_stage?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interview_v2_sessions_questionnaire_version_id_fkey";
            columns: ["questionnaire_version_id"];
            isOneToOne: false;
            referencedRelation: "interview_v2_questionnaire_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interview_v2_sessions_study_id_fkey";
            columns: ["study_id"];
            isOneToOne: false;
            referencedRelation: "studies";
            referencedColumns: ["id"];
          },
        ];
      };
      participants: {
        Row: {
          created_at: string;
          id: string;
          participant_code: string;
          study_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          participant_code: string;
          study_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          participant_code?: string;
          study_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "participants_study_id_fkey";
            columns: ["study_id"];
            isOneToOne: false;
            referencedRelation: "studies";
            referencedColumns: ["id"];
          },
        ];
      };
      questionnaire_questions: {
        Row: {
          construct: string;
          definition: Json;
          id: string;
          position: number;
          question_key: string;
          questionnaire_version_id: string;
          response_type: string;
          section_id: string;
        };
        Insert: {
          construct: string;
          definition: Json;
          id?: string;
          position: number;
          question_key: string;
          questionnaire_version_id: string;
          response_type: string;
          section_id: string;
        };
        Update: {
          construct?: string;
          definition?: Json;
          id?: string;
          position?: number;
          question_key?: string;
          questionnaire_version_id?: string;
          response_type?: string;
          section_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questionnaire_questions_questionnaire_version_id_fkey";
            columns: ["questionnaire_version_id"];
            isOneToOne: false;
            referencedRelation: "questionnaire_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      questionnaire_versions: {
        Row: {
          definition: Json;
          definition_hash: string;
          id: string;
          published_at: string;
          study_id: string;
          version: string;
        };
        Insert: {
          definition: Json;
          definition_hash: string;
          id?: string;
          published_at?: string;
          study_id: string;
          version: string;
        };
        Update: {
          definition?: Json;
          definition_hash?: string;
          id?: string;
          published_at?: string;
          study_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questionnaire_versions_study_id_fkey";
            columns: ["study_id"];
            isOneToOne: false;
            referencedRelation: "studies";
            referencedColumns: ["id"];
          },
        ];
      };
      researcher_profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      responses: {
        Row: {
          construct: string;
          id: string;
          method: Database["public"]["Enums"]["response_method"];
          question_id: string;
          question_key: string;
          recorded_at: string;
          response_type: string;
          session_id: string;
          skipped: boolean;
          text_value: string | null;
          updated_at: string;
          value: Json | null;
        };
        Insert: {
          construct: string;
          id?: string;
          method: Database["public"]["Enums"]["response_method"];
          question_id: string;
          question_key: string;
          recorded_at?: string;
          response_type: string;
          session_id: string;
          skipped?: boolean;
          text_value?: string | null;
          updated_at?: string;
          value?: Json | null;
        };
        Update: {
          construct?: string;
          id?: string;
          method?: Database["public"]["Enums"]["response_method"];
          question_id?: string;
          question_key?: string;
          recorded_at?: string;
          response_type?: string;
          session_id?: string;
          skipped?: boolean;
          text_value?: string | null;
          updated_at?: string;
          value?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "responses_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questionnaire_questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "responses_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          completed_at: string | null;
          created_by: string | null;
          current_step_id: string;
          id: string;
          last_activity_at: string;
          participant_id: string;
          questionnaire_version_id: string;
          researcher_notes: string | null;
          response_mode: Database["public"]["Enums"]["response_mode"];
          resume_expires_at: string;
          resume_token_hash: string;
          return_to_review: boolean;
          started_at: string;
          status: Database["public"]["Enums"]["session_status"];
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          created_by?: string | null;
          current_step_id?: string;
          id?: string;
          last_activity_at?: string;
          participant_id: string;
          questionnaire_version_id: string;
          researcher_notes?: string | null;
          response_mode: Database["public"]["Enums"]["response_mode"];
          resume_expires_at?: string;
          resume_token_hash: string;
          return_to_review?: boolean;
          started_at?: string;
          status?: Database["public"]["Enums"]["session_status"];
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          created_by?: string | null;
          current_step_id?: string;
          id?: string;
          last_activity_at?: string;
          participant_id?: string;
          questionnaire_version_id?: string;
          researcher_notes?: string | null;
          response_mode?: Database["public"]["Enums"]["response_mode"];
          resume_expires_at?: string;
          resume_token_hash?: string;
          return_to_review?: boolean;
          started_at?: string;
          status?: Database["public"]["Enums"]["session_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "participants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_questionnaire_version_id_fkey";
            columns: ["questionnaire_version_id"];
            isOneToOne: false;
            referencedRelation: "questionnaire_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      studies: {
        Row: {
          created_at: string;
          id: string;
          participant_counter: number;
          slug: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          participant_counter?: number;
          slug: string;
          title: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          participant_counter?: number;
          slug?: string;
          title?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_researcher: { Args: never; Returns: boolean };
      next_interview_v2_participant_code: { Args: never; Returns: string };
      next_participant_code: { Args: { p_study_id: string }; Returns: string };
      publish_interview_v2_questionnaire: {
        Args: {
          p_definition: Json;
          p_definition_hash: string;
          p_questions: Json;
          p_study_slug: string;
        };
        Returns: string;
      };
      start_interview_v2_session: {
        Args: {
          p_consent_version: string;
          p_created_by?: string;
          p_current_step_id: string;
          p_recording_consent: boolean;
          p_response_mode: Database["public"]["Enums"]["response_mode"];
          p_resume_token_hash: string;
          p_study_slug: string;
          p_study_stage: string;
        };
        Returns: {
          completed_at: string;
          consented_at: string;
          current_step_id: string;
          participant_code: string;
          return_to_review: boolean;
          session_id: string;
          started_at: string;
          status: Database["public"]["Enums"]["session_status"];
          study_stage: string;
        }[];
      };
    };
    Enums: {
      response_method: "selected" | "typed" | "voice" | "researcher";
      response_mode: "asynchronous_form" | "live_interview";
      session_status: "in_progress" | "completed" | "abandoned" | "withdrawn";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      response_method: ["selected", "typed", "voice", "researcher"],
      response_mode: ["asynchronous_form", "live_interview"],
      session_status: ["in_progress", "completed", "abandoned", "withdrawn"],
    },
  },
} as const;
