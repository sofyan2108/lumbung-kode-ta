/**
 * Supabase API Client for CLI
 */

import { createClient } from '@supabase/supabase-js'
import { getConfig, saveCredentials } from './config.js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants.js'

// Refresh access token using refresh token
async function refreshAccessToken() {
  const { refreshToken, email, userId } = getConfig()

  if (!refreshToken) {
    throw new Error('Sesi login berakhir. Silakan jalankan: lumbung login')
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })

  if (error || !data.session) {
    throw new Error('Sesi login berakhir. Silakan jalankan: lumbung login')
  }

  // Save new tokens
  saveCredentials(data.session.access_token, data.session.refresh_token, email, userId)
  return data.session.access_token
}

// Create Supabase client with given access token
function createSupabaseClientWithToken(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
}

// Create Supabase client (auto-refreshes token if expired)
export function createSupabaseClient() {
  const { accessToken } = getConfig()
  return createSupabaseClientWithToken(accessToken)
}

// Detect if error is JWT/auth expired (Supabase returns multiple formats)
function isJwtExpiredError(err) {
  if (!err) return false
  const msg = (err.message || '').toLowerCase()
  const code = (err.code || '')
  return (
    msg.includes('jwt expired') ||
    msg.includes('invalid jwt') ||
    msg.includes('token is expired') ||
    msg.includes('jws error') ||
    msg.includes('pgrst301') ||
    code === 'PGRST301' ||
    err.status === 401
  )
}

// Helper: run a query with auto token refresh on JWT expired
async function withAutoRefresh(queryFn) {
  try {
    const result = await queryFn(createSupabaseClient())
    return result
  } catch (err) {
    if (isJwtExpiredError(err)) {
      // Try to refresh token silently and retry
      const newToken = await refreshAccessToken()
      return await queryFn(createSupabaseClientWithToken(newToken))
    }
    throw err
  }
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

// Register with email/password
export async function registerWithEmail(email, password, fullName) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  })
  
  if (error) throw error
  
  return {
    accessToken: data.session?.access_token,
    refreshToken: data.session?.refresh_token,
    user: data.user
  }
}

// Fetch user snippets
export async function fetchMySnippets(options = {}) {
  const { userId } = getConfig()

  return withAutoRefresh(async (supabase) => {
    let query = supabase
      .from('snippets')
      .select('id, title, language, description, tags, is_public, created_at, like_count, copy_count')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options.language) query = query.ilike('language', options.language)
    if (options.isPublic !== undefined) query = query.eq('is_public', options.isPublic)
    if (options.limit) query = query.limit(parseInt(options.limit))

    const { data, error } = await query
    if (error) throw error
    return data
  })
}

// Fetch snippet by ID
export async function fetchSnippetById(id) {
  return withAutoRefresh(async (supabase) => {
    const { data, error } = await supabase
      .from('snippets')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  })
}

// Create new snippet
export async function createSnippet(snippetData) {
  const { userId } = getConfig()

  return withAutoRefresh(async (supabase) => {
    const { data, error } = await supabase
      .from('snippets')
      .insert({
        ...snippetData,
        user_id: userId
      })
      .select()
      .single()

    if (error) throw error
    return data
  })
}

// Search snippets with full-text search + ilike fallback (sama dengan web app)
export async function searchSnippets(query, options = {}) {
  const { userId } = getConfig()

  return withAutoRefresh(async (supabase) => {
    // Detect if query contains code symbols
    const hasCodeSymbols = /[(){}[\]=><;.,'"\\/+#@$%^&|~`]/.test(query)
    const buildBase = (client) => {
      let q = client
        .from('snippets')
        .select('id, title, language, description, tags, is_public, created_at, like_count')

      if (options.mine && userId) {
        // --mine: search only MY snippets (including private) → sama dengan Dashboard
        q = q.eq('user_id', userId)
      } else {
        // Default: search only PUBLIC snippets from ALL users → sama dengan Explore
        q = q.eq('is_public', true)
      }

      if (options.language) q = q.ilike('language', options.language)
      if (options.limit) q = q.limit(parseInt(options.limit))

      return q
    }

    // Step 1: Try FTS first (skip if query has code symbols)
    if (!hasCodeSymbols) {
      const { data: ftsData, error: ftsError } = await buildBase(supabase)
        .textSearch('search_vector', query, {
          type: 'websearch',
          config: 'simple'  // 'simple' = no stop words, no stemming → better for code keywords
        })
        .order('created_at', { ascending: false })

      if (!ftsError && ftsData && ftsData.length > 0) {
        return ftsData
      }
    }

    // Step 2: Fallback to ilike (handles code symbols & short words not in FTS index)
    const searchTerm = query.trim().split('\n')[0].trim().slice(0, 200)
    const { data: ilikeData, error: ilikeError } = await buildBase(supabase)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (ilikeError) throw ilikeError
    return ilikeData || []
  })
}
