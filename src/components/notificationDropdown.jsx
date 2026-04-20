import { useRef, useEffect } from 'react'
import { Bell, Heart, GitFork, Copy, Check } from 'lucide-react'
import { useNotificationStore } from '../store/notificationStore'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export default function NotificationDropdown({ isOpen, onClose }) {
  const dropdownRef = useRef(null)
  const { notifications, markAsRead, markAllAsRead, loading } = useNotificationStore()

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-red-500 fill-red-500" />
      case 'fork': return <GitFork size={16} className="text-purple-500" />
      case 'copy': return <Copy size={16} className="text-blue-500" />
      default: return <Bell size={16} />
    }
  }

  const getMessage = (notif) => {
    const actorName = notif.actor?.full_name || 'Seseorang'
    const snippetTitle = notif.snippet?.title || 'snippet Anda'
    
    switch (notif.type) {
      case 'like': return <span><b>{actorName}</b> menyukai snippet <b>{snippetTitle}</b></span>
      case 'fork': return <span><b>{actorName}</b> meng-fork snippet <b>{snippetTitle}</b></span>
      case 'copy': return <span><b>{actorName}</b> menyalin kode dari <b>{snippetTitle}</b></span>
      default: return <span>Activity baru di akun Anda</span>
    }
  }

  if (!isOpen) return null

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-12 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200"
    >
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 dark:text-gray-100">Notifikasi</h3>
        {notifications.length > 0 && (
            <button 
                onClick={markAllAsRead}
                className="text-xs font-bold text-pink-500 hover:text-pink-600 transition"
            >
                Tandai semua dibaca
            </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {loading && notifications.length === 0 ? (
           <div className="p-8 text-center text-gray-400 text-sm">Memuat...</div>
        ) : notifications.length === 0 ? (
           <div className="p-8 text-center flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400">
                    <Bell size={20} />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Belum ada notifikasi baru</p>
           </div>
        ) : (
           <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
             {notifications.map((notif) => (
                <div 
                    key={notif.id} 
                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                    className={`p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer ${
                        !notif.is_read ? 'bg-pink-50/30 dark:bg-pink-900/10' : ''
                    }`}
                >
                    <div className="mt-1 flex-shrink-0 relative">
                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500">
                            {notif.actor?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="absolute top-5 -left-1 w-5 h-5 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700">
                            {getIcon(notif.type)}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">
                            {getMessage(notif)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: idLocale })}
                        </p>
                    </div>
                    {!notif.is_read && (
                        <div className="self-center w-2 h-2 bg-pink-500 rounded-full"></div>
                    )}
                </div>
             ))}
           </div>
        )}
      </div>
    </div>
  )
}
