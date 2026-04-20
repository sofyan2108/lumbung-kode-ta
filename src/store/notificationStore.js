import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    set({ loading: true })
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!actor_id(full_name),
        snippet:snippets(title)
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error fetching notifications:", error)
    } else {
      set({ 
        notifications: data, 
        unreadCount: data.filter(n => !n.is_read).length 
      })
    }
    set({ loading: false })
  },

  markAsRead: async (id) => {
    // Optimistic update
    set(state => {
      const updated = state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n)
      return {
        notifications: updated,
        unreadCount: updated.filter(n => !n.is_read).length
      }
    })

    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  },

  markAllAsRead: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0
    }))

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false)
  },

  // Realtime Subscription
  subscribeToNotifications: () => {
    const user = supabase.auth.getUser().then(({ data }) => {
        if (!data.user) return

        const subscription = supabase
            .channel('public:notifications')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications',
                filter: `recipient_id=eq.${data.user.id}`
            }, async (payload) => {
                // Fetch full data for the new notification (need joins)
                const { data: newNotif } = await supabase
                    .from('notifications')
                    .select(`
                        *,
                        actor:profiles!actor_id(full_name),
                        snippet:snippets(title)
                    `)
                    .eq('id', payload.new.id)
                    .single()

                if (newNotif) {
                    set(state => ({
                        notifications: [newNotif, ...state.notifications],
                        unreadCount: state.unreadCount + 1
                    }))
                }
            })
            .subscribe()
            
        return subscription
    })
  }
}))
