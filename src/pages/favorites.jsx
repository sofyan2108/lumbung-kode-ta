import AppLayout from '../components/appLayout'
import SnippetCard from '../components/snippetCard'
import { useSnippetStore } from '../store/snippetStore'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Loader2, Heart } from 'lucide-react'

export default function Favorites() {
  const { favoriteSnippets, fetchFavorites, fetchMyFavoriteIds, loading } = useSnippetStore()
  const navigate = useNavigate()

  const handleSelectCollection = (collectionId) => {
    navigate('/dashboard', { state: { selectedCollection: collectionId } })
  }

  useEffect(() => {
    fetchFavorites()
    fetchMyFavoriteIds() // Pastikan status hati terupdate
  }, [])

  return (
    <AppLayout onSelectCollection={handleSelectCollection}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-pastel-text dark:text-white mb-2 flex items-center gap-3">
            <Heart className="text-red-500 fill-red-500" /> 
            My Favorites
        </h1>
        <p className="text-pastel-muted dark:text-gray-400">
            Koleksi kode yang Anda simpan dari komunitas.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-pastel-primary" size={40} />
        </div>
      ) : favoriteSnippets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl bg-gray-50/50 dark:bg-white/5">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-red-500">
                <Heart size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">
                Belum ada favorit
            </h3>
            <p className="text-gray-400 text-sm mt-1">
                Jelajahi menu Explore dan simpan kode menarik!
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteSnippets.map((snippet) => (
             <SnippetCard key={snippet.id} snippet={snippet} />
          ))}
        </div>
      )}
    </AppLayout>
  )
}