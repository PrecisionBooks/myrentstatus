import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper to get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Get user's company and role
export async function getUserProfile(email: string) {
  const { data, error } = await supabase
    .from('app_users')
    .select('*, companies(*)')
    .eq('email', email)
    .single()
  
  if (error) throw error
  return data
}

// Get user's accessible buildings
export async function getUserBuildings(email: string) {
  const { data, error } = await supabase
    .from('user_building_access')
    .select('building_id, buildings(*)')
    .eq('user_email', email)
  
  if (error) throw error
  return data
}

export type Database = {
  public: {
    Tables: {
      buildings: {
        Row: {
          id: number
          name: string
          created_at: string
        }
        Insert: {
          name: string
        }
        Update: {
          name?: string
        }
      }
      units: {
        Row: {
          id: number
          building_id: number
          unit_number: string
          created_at: string
        }
        Insert: {
          building_id: number
          unit_number: string
        }
        Update: {
          building_id?: number
          unit_number?: string
        }
      }
      tenants: {
        Row: {
          id: number
          unit_id: number
          primary_tenant_name: string
          primary_tenant_email: string | null
          primary_tenant_phone: string | null
          secondary_tenant_name: string | null
          secondary_tenant_email: string | null
          secondary_tenant_phone: string | null
          move_in_date: string
          lease_end_date: string
          current_rent: number
          original_rent: number
          security_deposit: number
          rent_anniversary_date: string
          has_pet: boolean
          has_parking: boolean
          notes: string | null
          lease_document_url: string | null
          prorated_first_month: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          unit_id: number
          primary_tenant_name: string
          primary_tenant_email?: string | null
          primary_tenant_phone?: string | null
          secondary_tenant_name?: string | null
          secondary_tenant_email?: string | null
          secondary_tenant_phone?: string | null
          move_in_date: string
          lease_end_date: string
          current_rent: number
          original_rent: number
          security_deposit: number
          rent_anniversary_date: string
          has_pet?: boolean
          has_parking?: boolean
          notes?: string | null
          lease_document_url?: string | null
          prorated_first_month?: number | null
          status?: string
        }
        Update: {
          unit_id?: number
          primary_tenant_name?: string
          primary_tenant_email?: string | null
          primary_tenant_phone?: string | null
          secondary_tenant_name?: string | null
          secondary_tenant_email?: string | null
          secondary_tenant_phone?: string | null
          move_in_date?: string
          lease_end_date?: string
          current_rent?: number
          security_deposit?: number
          rent_anniversary_date?: string
          has_pet?: boolean
          has_parking?: boolean
          notes?: string | null
          status?: string
        }
      }
      rent_increases: {
        Row: {
          id: number
          tenant_id: number
          previous_rent: number
          new_rent: number
          effective_date: string
          new_anniversary_date: string
          created_at: string
        }
        Insert: {
          tenant_id: number
          previous_rent: number
          new_rent: number
          effective_date: string
          new_anniversary_date: string
        }
        Update: {
          previous_rent?: number
          new_rent?: number
          effective_date?: string
          new_anniversary_date?: string
        }
      }
      move_outs: {
        Row: {
          id: number
          tenant_id: number
          move_out_date: string
          deposit_refund_amount: number
          notes: string | null
          created_at: string
        }
        Insert: {
          tenant_id: number
          move_out_date: string
          deposit_refund_amount: number
          notes?: string | null
        }
        Update: {
          move_out_date?: string
          deposit_refund_amount?: number
          notes?: string | null
        }
      }
    }
  }
}
