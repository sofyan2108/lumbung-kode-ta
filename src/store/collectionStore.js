import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useCollectionStore = create((set, get) => ({
  // State
  collections: [],
  activeCollectionId: null,
  loading: false,

  // ============================================
  // FETCH OPERATIONS
  // ============================================

  // Fetch all user collections with snippet count
  fetchCollections: async () => {
    set({ loading: true })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ loading: false })
        return
      }

      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          snippet_count:snippet_collections(count)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error

      // Transform count
      const collectionsWithCount = data.map(col => ({
        ...col,
        snippet_count: col.snippet_count?.[0]?.count || 0
      }))

      set({ collections: collectionsWithCount })
    } catch (error) {
      console.error('Error fetching collections:', error)
    } finally {
      set({ loading: false })
    }
  },

  // Get snippets in a specific collection
  getCollectionSnippets: async (collectionId) => {
    set({ loading: true })
    
    try {
      const { data, error } = await supabase
        .from('snippet_collections')
        .select(`
          snippet_id,
          snippets (
            *,
            profiles (full_name)
          )
        `)
        .eq('collection_id', collectionId)
      
      if (error) throw error

      set({ loading: false })
      return data.map(item => item.snippets).filter(Boolean)
    } catch (error) {
      console.error('Error fetching collection snippets:', error)
      set({ loading: false })
      return []
    }
  },

  // ============================================
  // CREATE OPERATIONS
  // ============================================

  createCollection: async (collectionData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Login required')

    const { data, error } = await supabase
      .from('collections')
      .insert([{
        ...collectionData,
        user_id: user.id
      }])
      .select()
    
    if (error) throw error

    // Add to state with count = 0
    const newCollection = { ...data[0], snippet_count: 0 }
    set(state => ({ 
      collections: [newCollection, ...state.collections] 
    }))

    return newCollection
  },

  // ============================================
  // UPDATE OPERATIONS
  // ============================================

  updateCollection: async (id, updates) => {
    const { data, error } = await supabase
      .from('collections')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
    
    if (error) throw error

    set(state => ({
      collections: state.collections.map(c => 
        c.id === id ? { ...c, ...data[0] } : c
      )
    }))

    return data[0]
  },

  // ============================================
  // DELETE OPERATIONS
  // ============================================

  deleteCollection: async (id) => {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)
    
    if (error) throw error

    set(state => ({
      collections: state.collections.filter(c => c.id !== id),
      activeCollectionId: state.activeCollectionId === id ? null : state.activeCollectionId
    }))
  },

  // ============================================
  // SNIPPET-COLLECTION RELATIONS
  // ============================================

  // Add snippet to collection
  addSnippetToCollection: async (snippetId, collectionId) => {
    const { error } = await supabase
      .from('snippet_collections')
      .insert({
        snippet_id: snippetId,
        collection_id: collectionId
      })
    
    if (error) {
      // Handle duplicate entry gracefully
      if (error.code === '23505') {
        throw new Error('Snippet sudah ada di collection ini')
      }
      throw error
    }

    // Increment count in state
    set(state => ({
      collections: state.collections.map(c => 
        c.id === collectionId 
          ? { ...c, snippet_count: c.snippet_count + 1 }
          : c
      )
    }))
  },

  // Remove snippet from collection
  removeSnippetFromCollection: async (snippetId, collectionId) => {
    const { error } = await supabase
      .from('snippet_collections')
      .delete()
      .match({
        snippet_id: snippetId,
        collection_id: collectionId
      })
    
    if (error) throw error

    // Decrement count in state
    set(state => ({
      collections: state.collections.map(c => 
        c.id === collectionId 
          ? { ...c, snippet_count: Math.max(0, c.snippet_count - 1) }
          : c
      )
    }))
  },

  // Add snippet to multiple collections at once
  addSnippetToMultipleCollections: async (snippetId, collectionIds) => {
    const inserts = collectionIds.map(collectionId => ({
      snippet_id: snippetId,
      collection_id: collectionId
    }))

    const { error } = await supabase
      .from('snippet_collections')
      .insert(inserts)
    
    if (error) throw error

    // Refresh collections to update counts
    get().fetchCollections()
  },

  // Get collections that contain a snippet
  getSnippetCollections: async (snippetId) => {
    const { data, error } = await supabase
      .from('snippet_collections')
      .select('collection_id, collections(*)')
      .eq('snippet_id', snippetId)
    
    if (error) throw error
    return data.map(item => item.collections)
  },

  // ============================================
  // UI STATE MANAGEMENT
  // ============================================

  setActiveCollection: (collectionId) => {
    set({ activeCollectionId: collectionId })
  },

  clearActiveCollection: () => {
    set({ activeCollectionId: null })
  }
}))
