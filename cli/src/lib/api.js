/**
 * Supabase API Client for CLI
 */

import { createClient } from '@supabase/supabase-js'
import { getConfig } from './config.js'

// Supabase credentials (same as web app)
const SUPABASE_URL = 'https://xwaxnszxtgelllkstrcd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3YXhuc3p4dGdlbGxsa3N0cmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTMwODUsImV4cCI6MjA4MDI2OTA4NX0.8rivgwRpax9X3OuR9qKX27y8-9CWcigZn0IGObKXU6o'

// Create Supabase client
export function createSupabaseClient() {
  const { accessToken } = getConfig()
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`
      } : {}
    }
  })
  
  return supabase
}

// Login with email/password
export async function loginWithEmail(email, password) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  
  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: data.user
  }
}

// Fetch user snippets
export async function fetchMySnippets(options = {}) {
  const supabase = createSupabaseClient()
  const { userId } = getConfig()
  
  let query = supabase
    .from('snippets')
    .select('id, title, language, description, tags, is_public, created_at, like_count, copy_count')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (options.language) {
    query = query.ilike('language', options.language)
  }
  
  if (options.isPublic !== undefined) {
    query = query.eq('is_public', options.isPublic)
  }
  
  if (options.limit) {
    query = query.limit(parseInt(options.limit))
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

// Fetch snippet by ID
export async function fetchSnippetById(id) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('snippets')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

// Create new snippet
export async function createSnippet(snippetData) {
  const supabase = createSupabaseClient()
  const { userId } = getConfig()
  
  const { data, error } = await supabase
    .from('snippets')
    .insert({
      ...snippetData,
      user_id: userId
    })
    .select()
    .single()
  
  if (error) {
    if (error.message && error.message.includes('JWT expired')) {
      throw new Error('Sesi login berakhir. Silakan jalankan: lumbung login')
    }
    throw error
  }
  return data
}

// Search snippets with full-text search
export async function searchSnippets(query, options = {}) {
  const supabase = createSupabaseClient()
  const { userId } = getConfig()
  
  let dbQuery = supabase
    .from('snippets')
    .select('id, title, language, description, tags, is_public, created_at, like_count')
    .textSearch('search_vector', query)
    .order('created_at', { ascending: false })
  
  // Filter by ownership
  if (options.mine) {
    dbQuery = dbQuery.eq('user_id', userId)
  } else if (options.publicOnly) {
    dbQuery = dbQuery.eq('is_public', true)
  }
  
  // Filter by language
  if (options.language) {
    dbQuery = dbQuery.ilike('language', options.language)
  }
  
  // Limit results
  if (options.limit) {
    dbQuery = dbQuery.limit(parseInt(options.limit))
  }
  
  const { data, error } = await dbQuery
  
  if (error) throw error
  return data
}

