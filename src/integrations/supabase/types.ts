export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "super_admin" | "investor_only" | "manager_only" | "investor_manager";
          property_id: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role: "super_admin" | "investor_only" | "manager_only" | "investor_manager";
          property_id?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: "super_admin" | "investor_only" | "manager_only" | "investor_manager";
          property_id?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          name: string;
          location: string | null;
          total_rooms: number;
          investment_scheme: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location?: string | null;
          total_rooms?: number;
          investment_scheme?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string | null;
          total_rooms?: number;
          investment_scheme?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
