import { X, FolderPlus, Check, Folder, CirclePlus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCollectionStore } from '../store/collectionStore'
import { useAlertStore } from '../store/alertStore'

export default function AddToCollectionModal({ isOpen, onClose, snippetId, onCreateCollection }) {
  const { 
    collections, 
    fetchCollections, 
    addSnippetToCollection,
    removeSnippetFromCollection,
    getSnippetCollections 
  } = useCollectionStore()
  
  const { showAlert } = useAlertStore()
  
  const [selectedCollections, setSelectedCollections] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialCollections, setInitialCollections] = useState([])

  useEffect(() => {
    if (isOpen && snippetId) {
      fetchCollections()
      loadSnippetCollections()
    }
  }, [isOpen, snippetId])

  const loadSnippetCollections = async () => {
    if (!snippetId) return
    
    try {
      const snippetCollections = await getSnippetCollections(snippetId)
      const collectionIds = snippetCollections.map(c => c.id)
      setSelectedCollections(collectionIds)
      setInitialCollections(collectionIds)
    } catch (error) {
      console.error('Error loading snippet collections:', error)
    }
  }

  const toggleCollection = (collectionId) => {
    setSelectedCollections(prev => 
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    )
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Find which collections to add and remove
      const toAdd = selectedCollections.filter(id => !initialCollections.includes(id))
      const toRemove = initialCollections.filter(id => !selectedCollections.includes(id))

      // Add to new collections
      for (const collectionId of toAdd) {
        await addSnippetToCollection(snippetId, collectionId)
      }

      // Remove from old collections
      for (const collectionId of toRemove) {
        await removeSnippetFromCollection(snippetId, collectionId)
      }

      showAlert('success', 'Tersimpan!', 'Snippet telah ditambahkan ke collection')
      onClose()
    } catch (error) {
      showAlert('error', 'Gagal', error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-pastel-dark-surface w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-pastel-dark-border overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-pastel-dark-border">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
            <FolderPlus size={20} className="text-indigo-500" />
            Tambah ke Collection
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Collections List */}
        <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
          {collections.length === 0 ? (
            <div className="text-center py-8">
              <FolderPlus size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Belum ada collection
              </p>
              <button
                onClick={() => { onClose(); onCreateCollection?.() }}
                className="mx-auto flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold rounded-xl transition shadow-sm"
              >
                <CirclePlus size={16} />
                Buat Collection Baru
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map(collection => {
                const isSelected = selectedCollections.includes(collection.id)
                
                return (
                  <button
                    key={collection.id}
                    onClick={() => toggleCollection(collection.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                      isSelected
                        ? 'shadow-sm'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                    style={{
                      backgroundColor: isSelected ? collection.color + '15' : 'transparent',
                      borderLeft: isSelected ? `3px solid ${collection.color}` : '3px solid transparent'
                    }}
                  >
                    {/* Checkbox */}
                    <div 
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                        isSelected
                          ? 'border-transparent'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{
                        backgroundColor: isSelected ? collection.color : 'transparent'
                      }}
                    >
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>

                    {/* Collection Info */}
                    <Folder size={18} style={{ color: collection.color }} />
                    <div className="flex-1 text-left">
                      <p className="font-bold text-sm text-gray-800 dark:text-white">
                        {collection.name}
                      </p>
                      {collection.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {collection.description}
                        </p>
                      )}
                    </div>

                    {/* Count */}
                    <span className="text-xs text-gray-400 font-medium">
                      {collection.snippet_count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {collections.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-pastel-dark-border flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/30 transition disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : `Simpan (${selectedCollections.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
