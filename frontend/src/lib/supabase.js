import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ervkqbncvboqsgvwjnpq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbG...mFC4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for wallet-based auth
export const getOrCreateUser = async (address) => {
  const { data: existing } = await supabase
    .from('users')
    .select('id, created_at')
    .eq('wallet_address', address.toLowerCase())
    .single()

  if (existing) return existing

  const { data: newUser, error } = await supabase
    .from('users')
    .insert([{ wallet_address: address.toLowerCase() }])
    .select()
    .single()

  if (error) throw error
  return newUser
}

export const getUserProjects = async (address) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('creator_address', address.toLowerCase())
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getAllProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      campaigns (
        id,
        category,
        rules,
        token_symbol,
        duration_days,
        created_at
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
