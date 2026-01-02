import { useState, useEffect } from 'react'
import { Bell, Sun, Moon, Menu } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { useNotificationStore } from '../store/notificationStore'
import NotificationDropdown from './notificationDropdown'

export default function TopBar({ onMenuClick }) {
  const { theme, toggleTheme } = useThemeStore()
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const { unreadCount, fetchNotifications, subscribeToNotifications } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
    const subscription = subscribeToNotifications()
    return () => {
        // Cleanup subscription if needed (optional since zustand store persists)
    }
  }, [])

  return (
    <header className="h-20 px-8 flex items-center justify-between bg-white dark:bg-pastel-dark-surface border-b border-gray-100 dark:border-pastel-dark-border sticky top-0 z-10 transition-colors duration-300">
      
      {/* Kiri: Title Halaman & Hamburger Mobile */}
      <div className="flex items-center gap-4">
         {/* Hamburger Trigger (All Screens) */}
         <button 
            onClick={onMenuClick}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition"
         >
            <Menu size={24} />
         </button>

         <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white transition-colors tracking-tight">
               LumbungCode
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Manage your snippets efficiently</p>
         </div>
      </div>

      {/* Tengah: Spacer */}
      <div className="flex-1"></div>

      {/* Kanan: Actions */}
      <div className="flex items-center gap-3 relative">
        <button 
          onClick={toggleTheme}
          className="p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition hover:rotate-12"
          title={theme === 'light' ? "Mode Gelap" : "Mode Terang"}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div className="relative">
            <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition relative group ${isNotifOpen ? 'bg-gray-100 dark:bg-white/10 text-pink-500' : ''}`}
            >
            <Bell size={20} />
            {/* Badge Notifikasi Realtime */}
            {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1F2937] animate-pulse"></span>
            )}
            </button>
            
            <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
        </div>
      </div>
    </header>
  )
}