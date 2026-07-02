/**
 * Tipos escritos a mano para arrancar el desarrollo inmediatamente.
 */

export type AnimalSpeciesEnum = 'dog' | 'cat' | 'other';
export type AnimalSizeEnum = 'small' | 'medium' | 'large';
export type AnimalStatusEnum = 'available' | 'foster' | 'adopted' | 'urgent';
export type ApplicationStatusEnum = 'pending' | 'reviewed' | 'approved' | 'rejected';
export type HouseTypeEnum = 'apartment' | 'house_with_yard' | 'house_no_yard' | 'farm' | 'other';

export interface Database {
  public: {
    Tables: {
      shelters: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          location: string | null;
          telegram_channel_id: string | null;
          logo_url: string | null;
          bio: string | null;
          instagram: string | null;
          facebook: string | null;
          website: string | null;
          slug: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          location?: string | null;
          telegram_channel_id?: string | null;
          logo_url?: string | null;
          bio?: string | null;
          instagram?: string | null;
          facebook?: string | null;
          website?: string | null;
          slug?: string | null;
        };
        Update: Partial<Database['public']['Tables']['shelters']['Insert']>;
        Relationships: [];
      };
      animals: {
        Row: {
          id: string;
          shelter_id: string;
          name: string;
          species: AnimalSpeciesEnum;
          breed: string | null;
          age_months: number | null;
          size: AnimalSizeEnum | null;
          health_status: string | null;
          personality_tags: string[];
          bio: string | null;
          status: AnimalStatusEnum;
          main_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shelter_id: string;
          name: string;
          species: AnimalSpeciesEnum;
          breed?: string | null;
          age_months?: number | null;
          size?: AnimalSizeEnum | null;
          health_status?: string | null;
          personality_tags?: string[];
          bio?: string | null;
          status?: AnimalStatusEnum;
          main_image_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['animals']['Insert']>;
        Relationships: [];
      };
      animal_photos: {
        Row: {
          id: string;
          animal_id: string;
          url: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          animal_id: string;
          url: string;
          position?: number;
        };
        Update: Partial<Database['public']['Tables']['animal_photos']['Insert']>;
        Relationships: [];
      };
      adoption_applications: {
        Row: {
          id: string;
          animal_id: string;
          applicant_name: string;
          applicant_email: string;
          applicant_phone: string | null;
          house_type: HouseTypeEnum | null;
          has_other_pets: boolean;
          status: ApplicationStatusEnum;
          answers_json: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          animal_id: string;
          applicant_name: string;
          applicant_email: string;
          applicant_phone?: string | null;
          house_type?: HouseTypeEnum | null;
          has_other_pets?: boolean;
          status?: ApplicationStatusEnum;
          answers_json?: Record<string, unknown>;
        };
        Update: Partial<Database['public']['Tables']['adoption_applications']['Insert']>;
        Relationships: [];
      };
      telegram_subscribers: {
        Row: {
          id: string;
          chat_id: number;
          shelter_id: string | null;
          preferences_json: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: number;
          shelter_id?: string | null;
          preferences_json?: Record<string, unknown>;
        };
        Update: Partial<Database['public']['Tables']['telegram_subscribers']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Shelter = Database['public']['Tables']['shelters']['Row'];
export type Animal = Database['public']['Tables']['animals']['Row'];
export type AnimalPhoto = Database['public']['Tables']['animal_photos']['Row'];
export type AdoptionApplication = Database['public']['Tables']['adoption_applications']['Row'];
export type TelegramSubscriber = Database['public']['Tables']['telegram_subscribers']['Row'];
