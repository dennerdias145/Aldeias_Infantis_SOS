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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agenda_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          kind: string
          location: string | null
          responsible: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          kind?: string
          location?: string | null
          responsible?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          kind?: string
          location?: string | null
          responsible?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      aldeias_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_label: string | null
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      aldeias_notifications: {
        Row: {
          body: string | null
          created_at: string
          family_id: string | null
          id: string
          kind: string
          link: string | null
          read: boolean
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          family_id?: string | null
          id?: string
          kind?: string
          link?: string | null
          read?: boolean
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          family_id?: string | null
          id?: string
          kind?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aldeias_notifications_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      campaign_contributions: {
        Row: {
          amount: number
          campaign_id: string
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          campaign_id: string
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          campaign_id?: string
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_contributions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_updates: {
        Row: {
          author_id: string
          campaign_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          author_id: string
          campaign_id: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          campaign_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_updates_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          category: string
          created_at: string
          creator_id: string
          current_amount: number
          description: string
          end_date: string | null
          goal_amount: number
          id: string
          image_url: string | null
          rejection_reason: string | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          creator_id: string
          current_amount?: number
          description: string
          end_date?: string | null
          goal_amount: number
          id?: string
          image_url?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          creator_id?: string
          current_amount?: number
          description?: string
          end_date?: string | null
          goal_amount?: number
          id?: string
          image_url?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      commitment_updates: {
        Row: {
          author_id: string | null
          author_kind: string
          commitment_id: string
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          to_status: string | null
        }
        Insert: {
          author_id?: string | null
          author_kind?: string
          commitment_id: string
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status?: string | null
        }
        Update: {
          author_id?: string | null
          author_kind?: string
          commitment_id?: string
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commitment_updates_commitment_id_fkey"
            columns: ["commitment_id"]
            isOneToOne: false
            referencedRelation: "commitments"
            referencedColumns: ["id"]
          },
        ]
      }
      commitments: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          family_id: string
          guidance: string | null
          id: string
          kind: string
          notes: string | null
          priority: string
          requires_confirmation: boolean
          responsible_id: string | null
          scheduled_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          family_id: string
          guidance?: string | null
          id?: string
          kind?: string
          notes?: string | null
          priority?: string
          requires_confirmation?: boolean
          responsible_id?: string | null
          scheduled_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          family_id?: string
          guidance?: string | null
          id?: string
          kind?: string
          notes?: string | null
          priority?: string
          requires_confirmation?: boolean
          responsible_id?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commitments_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      community_demands: {
        Row: {
          approximate_location: string | null
          category: string
          created_at: string
          description: string
          id: string
          photo_url: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approximate_location?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          photo_url?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approximate_location?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          photo_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      confidential_reports: {
        Row: {
          admin_notes: string | null
          approximate_location: string | null
          category: string
          created_at: string
          description: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approximate_location?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approximate_location?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          created_at: string
          entity: string
          entity_id: string
          id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          entity: string
          entity_id: string
          id?: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          entity?: string
          entity_id?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: []
      }
      donation_requests: {
        Row: {
          created_at: string
          donation_id: string
          id: string
          message: string | null
          requester_id: string
          status: string
        }
        Insert: {
          created_at?: string
          donation_id: string
          id?: string
          message?: string | null
          requester_id: string
          status?: string
        }
        Update: {
          created_at?: string
          donation_id?: string
          id?: string
          message?: string | null
          requester_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_requests_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          category: string
          condition: string | null
          created_at: string
          description: string | null
          donor_id: string
          expires_at: string | null
          id: string
          kind: string
          neighborhood: string
          photo_url: string | null
          quantity: number | null
          status: string
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          category: string
          condition?: string | null
          created_at?: string
          description?: string | null
          donor_id: string
          expires_at?: string | null
          id?: string
          kind: string
          neighborhood: string
          photo_url?: string | null
          quantity?: number | null
          status?: string
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          condition?: string | null
          created_at?: string
          description?: string | null
          donor_id?: string
          expires_at?: string | null
          id?: string
          kind?: string
          neighborhood?: string
          photo_url?: string | null
          quantity?: number | null
          status?: string
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          access_code: string
          contact_name: string | null
          created_at: string
          created_by: string | null
          id: string
          internal_code: string
          name: string
          notes: string | null
          responsible_id: string | null
          situation: string
          updated_at: string
        }
        Insert: {
          access_code: string
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          internal_code: string
          name: string
          notes?: string | null
          responsible_id?: string | null
          situation?: string
          updated_at?: string
        }
        Update: {
          access_code?: string
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          internal_code?: string
          name?: string
          notes?: string | null
          responsible_id?: string | null
          situation?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          birth_date: string | null
          created_at: string
          family_id: string
          id: string
          name: string
          relationship: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          family_id: string
          id?: string
          name: string
          relationship?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          family_id?: string
          id?: string
          name?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_professionals: {
        Row: {
          created_at: string
          family_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_professionals_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          active: boolean
          birth_date: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          relationship: string
          residence_id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          relationship: string
          residence_id: string
          user_id: string
        }
        Update: {
          active?: boolean
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          relationship?: string
          residence_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          id: string
          max_points: number | null
          min_points: number
          name: string
          sort_order: number
        }
        Insert: {
          id?: string
          max_points?: number | null
          min_points: number
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          max_points?: number | null
          min_points?: number
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          audio_path: string | null
          audio_seconds: number | null
          body: string | null
          commitment_id: string | null
          created_at: string
          family_id: string
          id: string
          sender_id: string | null
          sender_kind: string
        }
        Insert: {
          audio_path?: string | null
          audio_seconds?: number | null
          body?: string | null
          commitment_id?: string | null
          created_at?: string
          family_id: string
          id?: string
          sender_id?: string | null
          sender_kind: string
        }
        Update: {
          audio_path?: string | null
          audio_seconds?: number | null
          body?: string | null
          commitment_id?: string | null
          created_at?: string
          family_id?: string
          id?: string
          sender_id?: string | null
          sender_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_commitment_id_fkey"
            columns: ["commitment_id"]
            isOneToOne: false
            referencedRelation: "commitments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      missing_pets: {
        Row: {
          breed: string | null
          contact_phone: string | null
          created_at: string
          id: string
          last_seen_area: string
          last_seen_date: string
          last_seen_time: string | null
          name: string
          notes: string | null
          owner_user_id: string
          pet_id: string | null
          photo_url: string | null
          species: string
          status: string
          traits: string | null
          updated_at: string
        }
        Insert: {
          breed?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          last_seen_area: string
          last_seen_date: string
          last_seen_time?: string | null
          name: string
          notes?: string | null
          owner_user_id: string
          pet_id?: string | null
          photo_url?: string | null
          species: string
          status?: string
          traits?: string | null
          updated_at?: string
        }
        Update: {
          breed?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          last_seen_area?: string
          last_seen_date?: string
          last_seen_time?: string | null
          name?: string
          notes?: string | null
          owner_user_id?: string
          pet_id?: string | null
          photo_url?: string | null
          species?: string
          status?: string
          traits?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missing_pets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      pet_sightings: {
        Row: {
          approximate_location: string
          created_at: string
          description: string
          id: string
          missing_pet_id: string
          photo_url: string | null
          reporter_user_id: string
        }
        Insert: {
          approximate_location: string
          created_at?: string
          description: string
          id?: string
          missing_pet_id: string
          photo_url?: string | null
          reporter_user_id: string
        }
        Update: {
          approximate_location?: string
          created_at?: string
          description?: string
          id?: string
          missing_pet_id?: string
          photo_url?: string | null
          reporter_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_sightings_missing_pet_id_fkey"
            columns: ["missing_pet_id"]
            isOneToOne: false
            referencedRelation: "missing_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          active: boolean
          birth_date: string | null
          breed: string | null
          color: string | null
          created_at: string
          emergency_contact: string | null
          extra_photos: string[] | null
          has_microchip: boolean
          id: string
          microchip: string | null
          name: string
          notes: string | null
          owner_user_id: string
          photo_url: string | null
          sex: string | null
          size: string | null
          species: string
          traits: string | null
        }
        Insert: {
          active?: boolean
          birth_date?: string | null
          breed?: string | null
          color?: string | null
          created_at?: string
          emergency_contact?: string | null
          extra_photos?: string[] | null
          has_microchip?: boolean
          id?: string
          microchip?: string | null
          name: string
          notes?: string | null
          owner_user_id: string
          photo_url?: string | null
          sex?: string | null
          size?: string | null
          species: string
          traits?: string | null
        }
        Update: {
          active?: boolean
          birth_date?: string | null
          breed?: string | null
          color?: string | null
          created_at?: string
          emergency_contact?: string | null
          extra_photos?: string[] | null
          has_microchip?: boolean
          id?: string
          microchip?: string | null
          name?: string
          notes?: string | null
          owner_user_id?: string
          photo_url?: string | null
          sex?: string | null
          size?: string | null
          species?: string
          traits?: string | null
        }
        Relationships: []
      }
      point_rules: {
        Row: {
          action_type: string
          active: boolean
          id: string
          label: string
          points: number
        }
        Insert: {
          action_type: string
          active?: boolean
          id?: string
          label: string
          points?: number
        }
        Update: {
          action_type?: string
          active?: boolean
          id?: string
          label?: string
          points?: number
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          action_type: string
          created_at: string
          description: string | null
          id: string
          points: number
          reference_id: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description?: string | null
          id?: string
          points: number
          reference_id: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reference_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_private: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          phone: string | null
          residence_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          is_primary?: boolean
          phone?: string | null
          residence_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          phone?: string | null
          residence_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          blocked: boolean
          city: string | null
          created_at: string
          full_name: string
          id: string
          neighborhood: string | null
          points: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          blocked?: boolean
          city?: string | null
          created_at?: string
          full_name: string
          id: string
          neighborhood?: string | null
          points?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          blocked?: boolean
          city?: string | null
          created_at?: string
          full_name?: string
          id?: string
          neighborhood?: string | null
          points?: number
          updated_at?: string
        }
        Relationships: []
      }
      residences: {
        Row: {
          cep: string
          city: string
          complement: string | null
          created_at: string
          id: string
          neighborhood: string
          number: string
          residence_key: string
          state: string
          street: string
        }
        Insert: {
          cep: string
          city: string
          complement?: string | null
          created_at?: string
          id?: string
          neighborhood: string
          number: string
          residence_key: string
          state: string
          street: string
        }
        Update: {
          cep?: string
          city?: string
          complement?: string | null
          created_at?: string
          id?: string
          neighborhood?: string
          number?: string
          residence_key?: string
          state?: string
          street?: string
        }
        Relationships: []
      }
      service_providers: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          neighborhood: string
          phone: string | null
          photo_url: string | null
          status: string
          updated_at: string
          user_id: string
          whatsapp: string | null
          work_hours: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          neighborhood: string
          phone?: string | null
          photo_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
          work_hours?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          neighborhood?: string
          phone?: string | null
          photo_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
          work_hours?: string | null
        }
        Relationships: []
      }
      service_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          provider_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          provider_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          job_title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          job_title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      staff_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_points: {
        Args: { _action: string; _desc: string; _ref: string; _user: string }
        Returns: undefined
      }
      bootstrap_profile: { Args: never; Returns: Json }
      bootstrap_staff: { Args: never; Returns: Json }
      can_access_family: { Args: { _family_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_staff_role: {
        Args: {
          _role: Database["public"]["Enums"]["staff_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_staff_admin: { Args: never; Returns: boolean }
      is_staff_wide: { Args: never; Returns: boolean }
      normalize_txt: { Args: { _t: string }; Returns: string }
      notify: {
        Args: {
          _body: string
          _kind: string
          _link: string
          _title: string
          _user: string
        }
        Returns: undefined
      }
      refresh_overdue_commitments: { Args: never; Returns: undefined }
      residence_available: {
        Args: {
          _cep: string
          _city: string
          _complement: string
          _number: string
          _street: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "super_admin"
      staff_role: "admin" | "professional" | "coordination"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["user", "super_admin"],
      staff_role: ["admin", "professional", "coordination"],
    },
  },
} as const
