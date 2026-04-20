import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/appLayout'
import SnippetCard from '../components/snippetCard'
import EditProfileModal from '../components/editProfileModal' // Import Modal Baru
import { useSnippetStore } from '../store/snippetStore'
import { useAuthStore } from '../store/authStore'
import { Loader2, ArrowLeft, User, Code, Calendar, Globe, Edit2 } from 'lucide-react' // Tambah icon

export default function UserProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  
  const handleSelectCollection = (collectionId) => {
    navigate('/dashboard', { state: { selectedCollection: collectionId } })
  }
  
  const { currentProfile, currentProfileSnippets, fetchUserPublicProfile, fetchMyFavoriteIds, loading } = useSnippetStore()
  const { user: currentUser } = useAuthStore()
  
  // State Modal Edit Profil
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)

  useEffect(() => {
    if (userId) {
        fetchUserPublicProfile(userId)
        fetchMyFavoriteIds()
    }
  }, [userId])

  if (loading) {
    return (
      <AppLayout onSelectCollection={handleSelectCollection}>
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-pastel-primary" size={40} />
        </div>
      </AppLayout>
    )
  }

  if (!currentProfile && !loading) {
      return (
        <AppLayout onSelectCollection={handleSelectCollection}>
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-xl font-bold text-gray-600 dark:text-gray-300">Pengguna tidak ditemukan</h2>
                <button onClick={() => navigate('/explore')} className="mt-4 text-pastel-primary hover:underline">Kembali ke Explore</button>
            </div>
        </AppLayout>
      )
  }

  const isMe = currentUser?.id === userId

  return (
    <AppLayout onSelectCollection={handleSelectCollection}>
      <div className="max-w-6xl mx-auto pb-10">
        
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-pastel-primary dark:text-gray-400 dark:hover:text-white transition"
        >
          <ArrowLeft size={20} /> Kembali
        </button>

        {/* --- PROFILE HEADER CARD --- */}
        <div className="bg-white dark:bg-pastel-dark-surface rounded-3xl p-8 mb-10 shadow-lg border border-gray-100 dark:border-pastel-dark-border flex flex-col md:flex-row items-center gap-8 text-center md:text-left relative overflow-hidden">
            
            {/* Background Hiasan */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            {/* Avatar Besar */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-pink-400 to-pastel-primary p-1 shadow-xl relative z-10">
                <div className="w-full h-full rounded-full bg-white dark:bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
                    <span className="text-4xl font-bold text-gray-400">{currentProfile?.full_name?.charAt(0) || 'U'}</span>
                </div>
            </div>

            {/* Info User */}
            <div className="flex-1 relative z-10">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {currentProfile?.full_name || 'Anonymous Developer'}
                    </h1>
                    
                    {/* Tombol Edit Profil (Hanya Muncul Jika Profil Sendiri) */}
                    {isMe && (
                        <button 
                            onClick={() => setIsEditProfileOpen(true)}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                        >
                            <Edit2 size={14} /> Edit Profil
                        </button>
                    )}
                </div>
                
                {isMe && (
                    <span className="inline-block px-3 py-1 bg-pastel-primary/10 text-pastel-primary rounded-full text-xs font-bold mb-4">
                        It's You!
                    </span>
                )}

                {/* Website Link (Jika Ada) */}
                {currentProfile?.website && (
                    <a href={currentProfile.website} target="_blank" rel="noreferrer" className="flex items-center justify-center md:justify-start gap-2 text-pink-500 hover:underline mb-4 text-sm font-medium">
                        <Globe size={16} /> {currentProfile.website.replace(/^https?:\/\//, '')}
                    </a>
                )}

                <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-500 dark:text-gray-400 text-sm">
                    <div className="flex items-center gap-2">
                        <Code size={18} className="text-pink-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">{currentProfileSnippets.length}</span> Snippet Publik
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-blue-500" />
                        Bergabung sejak {new Date(currentProfile?.updated_at || Date.now()).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>
        </div>

        {/* --- PUBLIC SNIPPETS GRID --- */}
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 pl-2 border-l-4 border-pink-500">
            Koleksi Kode Publik
        </h2>

        {currentProfileSnippets.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-400">Pengguna ini belum membagikan snippet apapun.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentProfileSnippets.map((snippet) => (
                    <SnippetCard key={snippet.id} snippet={snippet} />
                ))}
            </div>
        )}

      </div>

      {/* MODAL EDIT PROFIL */}
      <EditProfileModal 
        isOpen={isEditProfileOpen} 
        onClose={() => setIsEditProfileOpen(false)} 
        currentProfile={currentProfile}
      />

    </AppLayout>
  )
}