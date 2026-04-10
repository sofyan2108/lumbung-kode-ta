import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useSnippetStore = create((set, get) => ({
  snippets: [],
  exploreSnippets: [],
  favoriteSnippets: [],
  favoriteIds: [], 
  
  // State untuk Profil Publik
  currentProfile: null,      
  currentProfileSnippets: [],
  
  loading: false,

  // --- Fetch Data Pribadi (Dashboard) ---
  fetchSnippets: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('snippets')
      .select('*, profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false })
    
    if (error) console.error(error)
    else set({ snippets: data })
    set({ loading: false })
  },

  // --- Fetch Data Explore (Public) ---
  fetchExploreSnippets: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('snippets')
      .select('*, profiles(full_name, avatar_url)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    
    if (error) console.error(error)
    else set({ exploreSnippets: data })
    set({ loading: false })
  },

  // --- BARU: Fetch Single Snippet (Detail Page) ---
  // Fungsi ini yang HILANG dan menyebabkan error
  fetchSnippetById: async (id) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('snippets')
      .select('*, profiles(full_name, avatar_url)')
      .eq('id', id)
      .single()

    set({ loading: false })
    
    if (error) {
      console.error("Error fetching detail:", error)
      return null
    }
    return data
  },

  // --- Fetch Profil Publik User Lain ---
  fetchUserPublicProfile: async (userId) => {
    set({ loading: true, currentProfile: null, currentProfileSnippets: [] })
    
    try {
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        
        if (profileError) throw profileError

        const { data: snippetsData, error: snippetsError } = await supabase
            .from('snippets')
            .select('*, profiles(full_name, avatar_url)')
            .eq('user_id', userId)
            .eq('is_public', true)
            .order('created_at', { ascending: false })

        if (snippetsError) throw snippetsError

        set({ 
            currentProfile: profileData,
            currentProfileSnippets: snippetsData
        })

    } catch (error) {
        console.error("Error fetching profile:", error)
    } finally {
        set({ loading: false })
    }
  },

  // --- Cek Status Like Saya ---
  fetchMyFavoriteIds: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('favorites')
      .select('snippet_id')
      .eq('user_id', user.id)
    
    if (data) {
      set({ favoriteIds: data.map(item => item.snippet_id) })
    }
  },

  // --- FITUR LIKE ---
  toggleLike: async (snippetId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        alert("Login dulu untuk menyukai snippet!")
        return
    }

    const isLiked = get().favoriteIds.includes(snippetId)

    // Optimistic Update
    set(state => ({
        favoriteIds: isLiked 
            ? state.favoriteIds.filter(id => id !== snippetId)
            : [...state.favoriteIds, snippetId],
        
        // Update di semua list state
        snippets: state.snippets.map(s => s.id === snippetId ? { ...s, like_count: (s.like_count || 0) + (isLiked ? -1 : 1) } : s),
        exploreSnippets: state.exploreSnippets.map(s => s.id === snippetId ? { ...s, like_count: (s.like_count || 0) + (isLiked ? -1 : 1) } : s),
        currentProfileSnippets: state.currentProfileSnippets.map(s => s.id === snippetId ? { ...s, like_count: (s.like_count || 0) + (isLiked ? -1 : 1) } : s)
    }))

    if (isLiked) {
        await supabase.from('favorites').delete().match({ user_id: user.id, snippet_id: snippetId })
    } else {
        await supabase.from('favorites').insert({ user_id: user.id, snippet_id: snippetId })

        // NOTIFIKASI: Kirim notif ke pemilik snippet
        try {
            let targetUserId = null;
            const targetSnippet = get().exploreSnippets.find(s => s.id === snippetId) || get().snippets.find(s => s.id === snippetId)
            
            if (targetSnippet) {
                targetUserId = targetSnippet.user_id
            } else {
                // Fetch fallback jika snippet tidak ada di store (misal di halaman detail direct access)
                const { data: dbSnippet } = await supabase.from('snippets').select('user_id').eq('id', snippetId).single()
                if (dbSnippet) targetUserId = dbSnippet.user_id
            }

            if (targetUserId && targetUserId !== user.id) {
               const { error: notifError } = await supabase.from('notifications').insert({
                  recipient_id: targetUserId,
                  actor_id: user.id,
                  snippet_id: snippetId,
                  type: 'like'
               })
               if (notifError) console.error("Failed to crate like notification:", notifError)
            }
        } catch (err) {
            console.error("Error creating notification:", err)
        }
    }
  },

  // --- FITUR FORK ---
  forkSnippet: async (snippet) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Login required")

    const newSnippet = {
        title: snippet.title + " (Fork)",
        code: snippet.code,
        language: snippet.language,
        description: snippet.description,
        tags: snippet.tags,
        is_public: false, 
        user_id: user.id, 
        copy_count: 0,
        like_count: 0
    }

    const { data, error } = await supabase.from('snippets').insert([newSnippet]).select()
    if (error) throw error
    set((state) => ({ snippets: [data[0], ...state.snippets] }))

    // NOTIFIKASI: Fork
    try {
        if (snippet.user_id !== user.id) {
            const { error: notifError } = await supabase.from('notifications').insert({
                recipient_id: snippet.user_id, // Gunakan snippet asli, bukan yang baru
                actor_id: user.id,
                snippet_id: snippet.id, 
                type: 'fork'
             })
             if (notifError) console.error("Failed to create fork notification:", notifError)
        }
    } catch (err) {
        console.error("Error creating notification:", err)
    }
  },

  // --- CRUD Standar ---
  addSnippet: async (newSnippet) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error("Login required")
    const { data, error } = await supabase.from('snippets').insert([{...newSnippet, user_id: session.user.id}]).select()
    if (error) throw error
    set((state) => ({ snippets: [data[0], ...state.snippets] }))
  },

  updateSnippet: async (id, updatedData) => {
    const { data, error } = await supabase.from('snippets').update(updatedData).eq('id', id).select()
    if (error) throw error
    set((state) => ({ snippets: state.snippets.map((s) => (s.id === id ? data[0] : s)) }))
  },

  deleteSnippet: async (id) => {
    const { error } = await supabase.from('snippets').delete().eq('id', id)
    if (error) throw error
    set((state) => ({ snippets: state.snippets.filter((s) => s.id !== id) }))
  },

  incrementCopy: async (id) => {
    // 1. Cek Session Storage untuk mencegah spamming copy di sesi yang sama
    const STORAGE_KEY = 'copied_snippets_session'
    const sessionCopied = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]')
    
    if (sessionCopied.includes(id)) {
        return // Sudah dicopy di sesi ini, jangan tambah hitungan
    }

    // 2. Lanjut update ke DB
    const { error } = await supabase.rpc('increment_copy_count', { snippet_id: id })
    if (error) return

    // 3. Update state lokal
    const updateCount = (s) => s.id === id ? { ...s, copy_count: (s.copy_count || 0) + 1 } : s
    
    set((state) => ({
      snippets: state.snippets.map(updateCount),
      exploreSnippets: state.exploreSnippets.map(updateCount),
      currentProfileSnippets: state.currentProfileSnippets.map(updateCount)
    }))

    // 4. Simpan ke Session Storage agar persist saat refresh
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...sessionCopied, id]))

    // NOTIFIKASI: Copy
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            let targetUserId = null;
            const targetSnippet = get().exploreSnippets.find(s => s.id === id) || get().snippets.find(s => s.id === id)
            
            if (targetSnippet) {
                targetUserId = targetSnippet.user_id
            } else {
                 // Fetch fallback
                 const { data: dbSnippet } = await supabase.from('snippets').select('user_id').eq('id', id).single()
                 if (dbSnippet) targetUserId = dbSnippet.user_id
            }

            if (targetUserId && targetUserId !== user.id) {
                const { error: notifError } = await supabase.from('notifications').insert({
                    recipient_id: targetUserId,
                    actor_id: user.id,
                    snippet_id: id,
                    type: 'copy'
                })
                if (notifError) console.error("Failed to create copy notification:", notifError)
            }
        }
    } catch (err) {
        console.error("Error creating notification:", err)
    }
  },

  // Hybrid search: FTS for keywords, ilike fallback for code snippets / symbols
  searchSnippetsFullText: async (query, userId = null) => {
    set({ loading: true })
    
    // Detect if query likely contains code (symbols, brackets, dots, etc.)
    const hasCodeSymbols = /[(){}[\]=><!;.,'"\\/*+#@$%^&|~`]/.test(query)

    try {
      let baseQuery = supabase
        .from('snippets')
        .select('*, profiles(full_name, avatar_url)')

      if (userId) {
        baseQuery = baseQuery.eq('user_id', userId)
      } else {
        baseQuery = baseQuery.eq('is_public', true)
      }

      let data = []
      let usedFallback = false

      // Step 1: Try FTS first (fast, ranked) — skip if query has code symbols
      if (!hasCodeSymbols) {
        const { data: ftsData, error: ftsError } = await baseQuery
          .textSearch('search_vector', query, {
            type: 'websearch',
            config: 'simple'        // 'simple' = no stop words, no stemming → better for code
          })
          .order('created_at', { ascending: false })
          .limit(50)

        if (!ftsError && ftsData && ftsData.length > 0) {
          data = ftsData
        } else {
          usedFallback = true
        }
      } else {
        usedFallback = true
      }

      // Step 2: Fallback to ilike substring search (handles symbols & exact code fragments)
      if (usedFallback) {
        // Take only the first meaningful segment if query is multi-line
        const searchTerm = query.trim().split('\n')[0].trim().slice(0, 200)

        // Re-build base query (can't reuse after first await)
        let fallbackQuery = supabase
          .from('snippets')
          .select('*, profiles(full_name, avatar_url)')

        if (userId) {
          fallbackQuery = fallbackQuery.eq('user_id', userId)
        } else {
          fallbackQuery = fallbackQuery.eq('is_public', true)
        }

        const { data: ilikeData, error: ilikeError } = await fallbackQuery
          .or(`code.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(50)

        if (!ilikeError) {
          data = ilikeData || []
        }
      }

      set({ loading: false })
      return data
    } catch (error) {
      console.error('Search error:', error)
      set({ loading: false })
      return []
    }
  },


  // Biarkan fetchFavorites untuk backward compatibility jika ada komponen lama yang pakai
  fetchFavorites: async () => {}, 
}))