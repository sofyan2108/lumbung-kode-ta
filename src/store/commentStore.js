import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useCommentStore = create((set, get) => ({
  comments: [],
  loading: false,
  submitting: false,

  // Fetch comments for a snippet
  fetchComments: async (snippetId) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('snippet_id', snippetId)
        .order('created_at', { ascending: true })

      if (error) throw error
      set({ comments: data || [] })
    } catch (error) {
      console.error('Fetch comments error:', error)
      set({ comments: [] })
    } finally {
      set({ loading: false })
    }
  },

  // Add a new comment
  addComment: async (snippetId, userId, content) => {
    set({ submitting: true })
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          snippet_id: snippetId,
          user_id: userId,
          content: content.trim()
        })
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single()

      if (error) throw error
      set({ comments: [...get().comments, data] })
      return data
    } catch (error) {
      console.error('Add comment error:', error)
      throw error
    } finally {
      set({ submitting: false })
    }
  },

  // Delete a comment
  deleteComment: async (commentId) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
      set({ comments: get().comments.filter(c => c.id !== commentId) })
    } catch (error) {
      console.error('Delete comment error:', error)
      throw error
    }
  },

  // Clear comments (when leaving page)
  clearComments: () => set({ comments: [] })
}))
