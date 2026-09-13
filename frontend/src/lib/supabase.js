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
    .select(`
      *,
      campaigns (
        id,
        category,
        token_symbol,
        total_locked,
        created_at
      )
    `)
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
        total_locked,
        created_at
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const getProjectById = async (id) => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      campaigns (
        id,
        category,
        rules,
        token_symbol,
        token_address,
        total_locked,
        duration_days,
        status,
        created_at
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export const updateProject = async (id, fields) => {
  const { data, error } = await supabase
    .from('projects')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
