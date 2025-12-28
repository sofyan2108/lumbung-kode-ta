import AppLayout from '../components/appLayout'
import SnippetCard from '../components/snippetCard'
import { useSnippetStore } from '../store/snippetStore'
import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Globe, Search } from 'lucide-react'

export default function Explore() {
  const { exploreSnippets, fetchExploreSnippets, fetchMyFavoriteIds, searchSnippetsFullText, loading } = useSnippetStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [allSearchResults, setAllSearchResults] = useState(null)
  const navigate = useNavigate()

  // Handler for collection click: navigate to Dashboard
  const handleSelectCollection = (collectionId) => {
    // Navigate to dashboard with collection selected (we'll use URL state)
    navigate('/dashboard', { state: { selectedCollection: collectionId } })
  }

  // Ambil data public saat halaman dibuka
  useEffect(() => {
    fetchExploreSnippets()
    fetchMyFavoriteIds() // Load status hati
  }, [])

  // Unified search: search in both title/tags AND code content (same as Dashboard)
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length > 2) {
        // Search in code content using full-text search (for public snippets only)
        const codeResults = await searchSnippetsFullText(searchQuery, null) // null = public only
        setAllSearchResults(codeResults)
      } else {
        setAllSearchResults(null)
      }
    }
    
    const debounce = setTimeout(performSearch, 500)
    return () => clearTimeout(debounce)
  }, [searchQuery, searchSnippetsFullText])

  // Filter Search
  const filteredSnippets = useMemo(() => {
    // Use search results if searching (query >= 3 chars), otherwise use all explore snippets
    let result = allSearchResults && searchQuery.trim().length > 2
      ? allSearchResults
      : exploreSnippets
    
    // Additional title/tag filter for short queries (1-2 chars)
    if (searchQuery.trim() && searchQuery.trim().length <= 2) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s => 
        s.title.toLowerCase().includes(q) || 
        (s.tags && s.tags.some(t => t.toLowerCase().includes(q))) ||
        s.language.toLowerCase().includes(q)
      )
    }
    
    return result
  }, [exploreSnippets, searchQuery, allSearchResults])

  return (
    <AppLayout onSelectCollection={handleSelectCollection}>
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center p-3 bg-pastel-primary/10 text-pastel-primary rounded-full mb-4">
            <Globe size={24} />
        </div>
        <h1 className="text-3xl font-bold text-pastel-text dark:text-white mb-2">
            Community Explore
        </h1>
        <p className="text-pastel-muted dark:text-gray-400">
            Temukan inspirasi dari ribuan kode yang dibagikan developer lain.
        </p>
      </div>

      {/* Search Bar Besar */}
      <div className="max-w-xl mx-auto mb-12 relative group">
         <div className="absolute inset-0 bg-pastel-primary/20 dark:bg-pastel-primary-dark/10 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition duration-500"></div>
         <div className="relative">
            <Search className="absolute left-5 top-4 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Cari snippet... (judul, tag, atau kode)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white dark:bg-pastel-dark-surface rounded-full shadow-lg border border-gray-100 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-pastel-primary/50 text-gray-700 dark:text-white placeholder-gray-400 transition-all"
            />
            {searchQuery.trim().length > 2 && (
              <div className="absolute right-5 top-4">
                <span className="text-xs text-indigo-500 dark:text-indigo-400 font-medium px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded">Searching...</span>
              </div>
            )}
         </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-pastel-primary" size={40} />
        </div>
      ) : filteredSnippets.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
            Belum ada snippet public ditemukan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSnippets.map((snippet) => (
             <SnippetCard key={snippet.id} snippet={snippet} />
          ))}
        </div>
      )}
    </AppLayout>
  )
}