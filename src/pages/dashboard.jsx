import AppLayout from '../components/appLayout'
import SnippetCard from '../components/snippetCard'
import AddSnippetModal from '../components/addSnippetModal'
import { useAuthStore } from '../store/authStore'
import { useSnippetStore } from '../store/snippetStore'
import { useCollectionStore } from '../store/collectionStore'
import { useAlertStore } from '../store/alertStore'
import CreateCollectionModal from '../components/createCollectionModal'
import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2, PlusCircle, Search, Filter, ArrowUpDown, Globe, Pencil, Trash2 } from 'lucide-react'
import { popularLanguages } from '../utils/languageConfig'
import { useShortcut } from '../hooks/useShortcut'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { snippets, fetchSnippets, fetchMyFavoriteIds, searchSnippetsFullText, loading } = useSnippetStore()
  const { showAlert } = useAlertStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState('newest')
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const [filterVisibility, setFilterVisibility] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [collectionSnippets, setCollectionSnippets] = useState([])
  const [allSearchResults, setAllSearchResults] = useState(null)
  const [showEditCollectionModal, setShowEditCollectionModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const searchInputRef = useRef(null)
  const { getCollectionSnippets, collections, deleteCollection } = useCollectionStore()

  // Get active collection details
  const activeCollection = collections.find(c => c.id === selectedCollection)

  // LOGIC TOMBOL ADD (CHECK USER)
  const handleAddClick = () => {
    if (!user) {
        showAlert('error', 'Login Diperlukan', 'Silakan login terlebih dahulu untuk membuat snippet baru.', true)
        return
    }
    setIsAddModalOpen(true)
  }

  useShortcut('k', () => {
    searchInputRef.current?.focus()
  }, { ctrlKey: true })

  useShortcut('n', () => {
    if (!user) {
        showAlert('error', 'Login Diperlukan', 'Silakan login terlebih dahulu.', true)
        return
    }
    setIsAddModalOpen(true)
  }, { altKey: true })

  useEffect(() => {
    // Jangan redirect paksa jika di dashboard publik (walaupun logic sekarang dashboard = private collection)
    // Tapi untuk konsistensi dengan tombol, kita biarkan saja user null melihat dashboard kosong
    // atau redirect ke login jika memang dashboard wajib login. 
    // Di sini kita biarkan redirect login jika dashboard memang untuk personal.
    if (!user) navigate('/login')
  }, [user, navigate])

  useEffect(() => {
    if (user) {
      fetchSnippets()
      fetchMyFavoriteIds()
    }
  }, [user])

  // Handle collection selection
  useEffect(() => {
    const loadCollectionSnippets = async () => {
      if (selectedCollection) {
        const snippets = await getCollectionSnippets(selectedCollection)
        setCollectionSnippets(snippets)
      } else {
        setCollectionSnippets([])
      }
    }
    loadCollectionSnippets()
  }, [selectedCollection, getCollectionSnippets])

  // Handle collection from URL state (when navigated from Explore)
  useEffect(() => {
    if (location.state?.selectedCollection) {
      setSelectedCollection(location.state.selectedCollection)
      // Clear state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, navigate, location.pathname])

  // Unified search: search in both title/tags AND code content
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length > 2) {
        // Search in code content using full-text search
        const codeResults = await searchSnippetsFullText(searchQuery, user?.id)
        setAllSearchResults(codeResults)
      } else {
        setAllSearchResults(null)
      }
    }
    
    const debounce = setTimeout(performSearch, 500)
    return () => clearTimeout(debounce)
  }, [searchQuery, user, searchSnippetsFullText])

  const filteredSnippets = useMemo(() => {
    // Base snippets: use search results if searching, otherwise use collection or all
    let result = allSearchResults && searchQuery.trim().length > 2
      ? allSearchResults
      : selectedCollection 
        ? collectionSnippets 
        : snippets.filter(s => s.user_id === user?.id)

    if (selectedLanguage !== 'all') {
      result = result.filter(s => s.language.toLowerCase() === selectedLanguage.toLowerCase())
    }

    // Additional title/tag filter (works even with code search results)
    if (searchQuery.trim() && searchQuery.trim().length <= 2) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s => 
        s.title.toLowerCase().includes(q) || 
        (s.tags && s.tags.some(tag => tag.toLowerCase().includes(q)))
      )
    }

    if (filterVisibility === 'public') {
      result = result.filter(s => s.is_public === true)
    } else if (filterVisibility === 'private') {
      result = result.filter(s => s.is_public === false)
    }

    result.sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.created_at) - new Date(a.created_at)
      if (sortOption === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
      if (sortOption === 'popular') return (b.copy_count || 0) - (a.copy_count || 0)
      return 0
    })

    return result
  }, [snippets, user, searchQuery, sortOption, selectedLanguage, filterVisibility, selectedCollection, collectionSnippets])

  const availableLanguages = useMemo(() => {
    const langs = snippets.filter(s => s.user_id === user?.id).map(s => s.language)
    const seen = new Set()
    const result = []
    langs.forEach(lang => {
        const lower = lang.toLowerCase()
        if (!seen.has(lower)) {
            seen.add(lower)
            const prettyName = popularLanguages.find(p => p.toLowerCase() === lower) || lang
            result.push(prettyName)
        }
    })
    return ['all', ...result]
  }, [snippets, user])

  const handleSelectCollection = (collectionId) => {
    setSelectedCollection(collectionId)
  }

  const handleDeleteCollection = async () => {
    if (!selectedCollection) return
    
    try {
      await deleteCollection(selectedCollection)
      setSelectedCollection(null)
      setShowDeleteConfirm(false)
      showAlert('success', 'Berhasil!', 'Collection berhasil dihapus')
    } catch (error) {
      showAlert('error', 'Gagal', 'Gagal menghapus collection')
    }
  }

  return (
    <AppLayout onSelectCollection={handleSelectCollection}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-pastel-text dark:text-white mb-2">
          {selectedCollection ? (
            <div className="flex items-center gap-3">
              <span>Dashboard</span>
              <span className="text-gray-400 dark:text-gray-500">/</span>
              <div 
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xl"
                style={{
                  backgroundColor: activeCollection?.color + '20',
                  borderLeft: `4px solid ${activeCollection?.color}`
                }}
              >
                <span className="text-2xl">{activeCollection?.icon}</span>
                <span>{activeCollection?.name || 'Collection'}</span>
                
                {/* Quick Actions */}
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => setShowEditCollectionModal(true)}
                    className="p-1.5 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition"
                    title="Edit Collection"
                  >
                    <Pencil size={16} className="text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    title="Delete Collection"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            'Dashboard'
          )}
        </h1>
        <p className="text-pastel-muted dark:text-gray-400">
          {selectedCollection 
            ? `${activeCollection?.snippet_count || 0} snippet dalam collection ini` 
            : 'Kelola dan temukan kodemu dengan mudah.'}
        </p>
      </div>

      {/* Search Bar - Full Width */}
      <div className="mb-4">
        <div className="relative group">
            <Search className="absolute left-4 top-3 text-gray-400 group-focus-within:text-pastel-primary transition" size={18} />
            <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Cari snippet... (judul, tag, atau kode)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-pastel-dark-surface rounded-2xl shadow-sm focus:shadow-md focus:ring-0 text-gray-700 dark:text-white placeholder-gray-400 transition-all outline-none"
            />
            <div className="absolute right-4 top-3.5 hidden md:flex items-center gap-1 pointer-events-none">
                {searchQuery.trim().length > 2 ? (
                  <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 rounded">Searching...</span>
                ) : (
                  <kbd className="hidden sm:inline-block border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-300 rounded px-1.5 py-0.5 text-[10px] font-sans font-bold shadow-sm">Ctrl + K</kbd>
                )}
            </div>
        </div>
      </div>

      {/* Filters - Below Search */}
      <div className="mb-8 flex flex-wrap gap-3">
            <div className="relative min-w-[140px] flex-1 sm:flex-none group">
                <Filter className="absolute left-3 top-3 text-gray-400 group-hover:text-pastel-primary transition" size={16} />
                <select 
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full pl-9 pr-8 py-3 bg-white dark:bg-pastel-dark-surface rounded-2xl shadow-sm cursor-pointer focus:shadow-md outline-none text-sm font-medium text-gray-600 dark:text-gray-300 appearance-none transition-all hover:bg-gray-50 dark:hover:bg-white/5"
                >
                    <option value="all">Semua Bahasa</option>
                    {availableLanguages.filter(l => l !== 'all').map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
            </div>

            <div className="relative min-w-[140px] flex-1 sm:flex-none group">
                <Globe className="absolute left-3 top-3 text-gray-400 group-hover:text-pastel-primary transition" size={16} />
                <select 
                    value={filterVisibility}
                    onChange={(e) => setFilterVisibility(e.target.value)}
                    className="w-full pl-9 pr-8 py-3 bg-white dark:bg-pastel-dark-surface rounded-2xl shadow-sm cursor-pointer focus:shadow-md outline-none text-sm font-medium text-gray-600 dark:text-gray-300 appearance-none transition-all hover:bg-gray-50 dark:hover:bg-white/5"
                >
                    <option value="all">Semua Status</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
            </div>

            <div className="relative min-w-[160px] flex-1 sm:flex-none group">
                <ArrowUpDown className="absolute left-3 top-3 text-gray-400 group-hover:text-pastel-primary transition" size={16} />
                <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="w-full pl-9 pr-8 py-3 bg-white dark:bg-pastel-dark-surface rounded-2xl shadow-sm cursor-pointer focus:shadow-md outline-none text-sm font-medium text-gray-600 dark:text-gray-300 appearance-none transition-all hover:bg-gray-50 dark:hover:bg-white/5"
                >
                    <option value="newest">Waktu: Terbaru</option>
                    <option value="oldest">Waktu: Terlama</option>
                    <option value="popular">Populer (Copy)</option>
                </select>
            </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-pastel-primary" size={40} />
        </div>
      ) : filteredSnippets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl bg-gray-50/50 dark:bg-white/5">
            <button 
                onClick={handleAddClick}
                className="w-16 h-16 bg-pastel-primary/10 rounded-full flex items-center justify-center mb-4 text-pastel-primary hover:bg-pastel-primary/20 transition cursor-pointer"
            >
                {searchQuery || selectedLanguage !== 'all' || filterVisibility !== 'all' ? <Search size={32}/> : <PlusCircle size={32} />}
            </button>
            <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">
                {searchQuery || filterVisibility !== 'all' ? 'Tidak ditemukan' : 'Belum ada snippet'}
            </h3>
            <p className="text-gray-400 text-sm mt-1">
                {searchQuery || filterVisibility !== 'all' ? 'Coba ubah kata kunci atau filter.' : 'Buat snippet pertamamu sekarang! (Tekan Alt+N)'}
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSnippets.map((snippet) => (
             <SnippetCard key={snippet.id} snippet={snippet} />
          ))}
        </div>
      )}

        <AddSnippetModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
        />

        {/* Edit Collection Modal */}
        <CreateCollectionModal
          isOpen={showEditCollectionModal}
          onClose={() => setShowEditCollectionModal(false)}
          editMode={true}
          collectionToEdit={activeCollection}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-pastel-dark-surface w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 dark:border-pastel-dark-border p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-4">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Delete Collection?</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                  Yakin ingin menghapus collection <strong>"{activeCollection?.name}"</strong>? Snippet tidak akan terhapus.
                </p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)} 
                    className="flex-1 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleDeleteCollection} 
                    className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition flex items-center justify-center gap-2"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </AppLayout>
  )
}