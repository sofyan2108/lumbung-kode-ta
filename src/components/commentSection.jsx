import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCommentStore } from '../store/commentStore'
import { useAuthStore } from '../store/authStore'
import { useAlertStore } from '../store/alertStore'
import { Loader2, MessageCircle, Send, Trash2, User as UserIcon, X, LogIn } from 'lucide-react'

export default function CommentSection({ snippetId, isPublic }) {
  const { comments, loading, submitting, fetchComments, addComment, deleteComment, clearComments } = useCommentStore()
  const { user } = useAuthStore()
  const { showAlert } = useAlertStore()
  
  const [content, setContent] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  useEffect(() => {
    if (snippetId) {
      fetchComments(snippetId)
    }
    return () => clearComments()
  }, [snippetId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return

    if (!user) {
      showAlert('error', 'Login Diperlukan', 'Silakan login untuk menambahkan komentar.', true)
      return
    }

    try {
      await addComment(snippetId, user.id, content)
      setContent('')
    } catch (error) {
      showAlert('error', 'Gagal', 'Gagal menambahkan komentar.')
    }
  }

  const handleDelete = async (commentId) => {
    setDeleteConfirmId(null)
    try {
      await deleteComment(commentId)
      showAlert('success', 'Dihapus', 'Komentar berhasil dihapus.')
    } catch (error) {
      showAlert('error', 'Gagal', 'Gagal menghapus komentar.')
    }
  }

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = (now - date) / 1000

    if (diff < 60) return 'Baru saja'
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (!isPublic) return null

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
          <MessageCircle size={20} className="text-indigo-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Komentar
        </h3>
        <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400">
          {comments.length}
        </span>
      </div>

      {/* Comment List */}
      <div className="space-y-4 mb-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-500" size={24} />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <MessageCircle size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">Belum ada komentar</p>
            <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">Jadilah yang pertama berkomentar!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group relative flex gap-3 p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all">
              {/* Avatar */}
              <Link to={`/user/${comment.user_id}`} className="flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-indigo-500 dark:bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm hover:ring-2 ring-indigo-500/50 transition">
                  {comment.profiles?.full_name?.charAt(0).toUpperCase() || <UserIcon size={14} />}
                </div>
              </Link>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link to={`/user/${comment.user_id}`} className="text-sm font-bold text-gray-800 dark:text-gray-200 hover:text-pink-500 transition truncate">
                    {comment.profiles?.full_name || 'Anonymous'}
                  </Link>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                    {formatTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>

              {/* Delete button (own comment only) */}
              {user?.id === comment.user_id && (
                <button
                  onClick={() => setDeleteConfirmId(comment.id)}
                  className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  title="Hapus komentar"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-3 items-start">
          <div className="w-9 h-9 rounded-full bg-indigo-500 dark:bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            {user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis komentar..."
              maxLength={2000}
              rows={2}
              className="w-full px-4 py-3 pr-24 bg-white dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition resize-none"
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              <span className="text-[10px] text-gray-400">{content.length}/2000</span>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-indigo-500/20 hover:-translate-y-0.5 active:scale-95"
              >
                {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Kirim
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-center gap-3 py-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
          <LogIn size={16} className="text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            <Link to="/login" className="text-indigo-500 font-bold hover:underline">Login</Link> untuk menambahkan komentar
          </span>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-pastel-dark-surface w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 dark:border-pastel-dark-border p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hapus Komentar?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Komentar yang dihapus tidak dapat dikembalikan.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition">Batal</button>
                <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition flex items-center justify-center gap-2 active:scale-95">
                  <Trash2 size={16} /> Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
