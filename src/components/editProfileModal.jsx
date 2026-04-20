import { X, User, Globe, Save, Loader2, Link as LinkIcon, Camera } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useAlertStore } from '../store/alertStore'

export default function EditProfileModal({ isOpen, onClose, currentProfile }) {
  const { updateProfile } = useAuthStore()
  const { showAlert } = useAlertStore()
  const [loading, setLoading] = useState(false)

  // State Form
  const [fullName, setFullName] = useState('')
  const [website, setWebsite] = useState('')

  // Isi form dengan data yang ada saat modal dibuka
  useEffect(() => {
    if (currentProfile) {
      setFullName(currentProfile.full_name || '')
      setWebsite(currentProfile.website || '')
    }
  }, [currentProfile, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile({
        full_name: fullName,
        website: website,
        updated_at: new Date(),
      })
      
      showAlert('success', 'Profil Diperbarui', 'Perubahan data diri berhasil disimpan.')
      onClose()
      // Kita perlu reload halaman atau trigger fetch ulang di parent component
      // Agar simpel, kita gunakan window.location.reload() atau biarkan parent handle refresh state
      window.location.reload() 
    } catch (error) {
      showAlert('error', 'Gagal Update', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
      
      <div className="bg-white dark:bg-pastel-dark-surface w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-pastel-dark-border overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-pastel-dark-border bg-gray-50 dark:bg-white/5">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
            <User size={20} className="text-pink-500" />
            Edit Profil
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1 ml-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500/50 dark:text-white focus:outline-none transition"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1 ml-1">Website / Portfolio</label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="https://myportfolio.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500/50 dark:text-white focus:outline-none transition"
                />
              </div>
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-pastel-dark-border flex justify-end gap-3">
          <button 
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg font-medium transition"
          >
            Batal
          </button>
          <button 
            type="submit"
            form="profile-form"
            disabled={loading}
            className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-bold shadow-lg shadow-pink-500/30 transition flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18} /> Simpan</>}
          </button>
        </div>
      </div>
    </div>
  )
}