import { X, Folder, Palette, Type } from 'lucide-react'
import { useState } from 'react'
import { useCollectionStore } from '../store/collectionStore'
import { useAlertStore } from '../store/alertStore'

const PRESET_ICONS = ['📁', '📚', '⚡', '🎨', '🔧', '🚀', '💡', '🎯', '🔥', '✨', '📦', '🎭']
const PRESET_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Gray', value: '#6b7280' }
]

export default function CreateCollectionModal({ isOpen, onClose, editCollection = null }) {
  const { createCollection, updateCollection } = useCollectionStore()
  const { showAlert } = useAlertStore()
  
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(editCollection?.name || '')
  const [description, setDescription] = useState(editCollection?.description || '')
  const [selectedIcon, setSelectedIcon] = useState(editCollection?.icon || '📁')
  const [selectedColor, setSelectedColor] = useState(editCollection?.color || '#6366f1')

  if (!isOpen) return null

  const isEditMode = !!editCollection

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      showAlert('error', 'Validasi', 'Nama collection wajib diisi')
      return
    }

    setLoading(true)
    try {
      const collectionData = {
        name: name.trim(),
        description: description.trim(),
        icon: selectedIcon,
        color: selectedColor
      }

      if (isEditMode) {
        await updateCollection(editCollection.id, collectionData)
        showAlert('success', 'Tersimpan!', 'Collection berhasil diupdate')
      } else {
        await createCollection(collectionData)
        showAlert('success', 'Berhasil!', 'Collection baru telah dibuat')
      }

      onClose()
    } catch (error) {
      showAlert('error', 'Gagal', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-pastel-dark-surface w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-pastel-dark-border overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-pastel-dark-border flex-shrink-0">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
            <Folder size={20} className="text-indigo-500" />
            {isEditMode ? 'Edit Collection' : 'New Collection'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1" style={{maxHeight: 'calc(90vh - 140px)'}}>
          
          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
              <Type size={14} />
              Nama Collection
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="React Hooks, Python Scripts, etc."
              maxLength={50}
              className="w-full px-4 py-2.5 bg-white dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 dark:text-white focus:outline-none transition"
              autoFocus
            />
            <div className="text-right mt-1">
              <span className="text-xs text-gray-400">{name.length}/50</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">
              Deskripsi (Opsional)
            </label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kumpulan custom hooks untuk React..."
              maxLength={200}
              className="w-full px-4 py-2.5 bg-white dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 dark:text-white focus:outline-none resize-none transition"
            />
            <div className="text-right mt-1">
              <span className="text-xs text-gray-400">{description.length}/200</span>
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`p-3 text-2xl rounded-lg border-2 transition hover:scale-110 ${
                    selectedIcon === icon
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
              <Palette size={14} />
              Warna
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`p-3 rounded-lg border-2 transition hover:scale-105 flex items-center justify-center ${
                    selectedColor === color.value
                      ? 'border-gray-800 dark:border-white'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                >
                  {selectedColor === color.value && (
                    <span className="text-white text-xl">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
            <div 
              className="flex items-center gap-3 px-4 py-3 rounded-lg"
              style={{ backgroundColor: selectedColor + '20', borderLeft: `4px solid ${selectedColor}` }}
            >
              <span className="text-2xl">{selectedIcon}</span>
              <div className="flex-1">
                <p className="font-bold text-gray-800 dark:text-white">
                  {name || 'Nama Collection'}
                </p>
                {description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Menyimpan...' : isEditMode ? 'Update' : 'Buat Collection'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
