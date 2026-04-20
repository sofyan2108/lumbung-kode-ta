import { Copy, Tag, Check, Globe, Lock, User as UserIcon, Heart, GitFork, X, Download, FolderPlus, FolderMinus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { dracula } from '@uiw/codemirror-theme-dracula'
import { githubLight } from '@uiw/codemirror-theme-github'
import { useSnippetStore } from '../store/snippetStore'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import { useAlertStore } from '../store/alertStore'
import { getLanguageExtension, getLangColor, getFileExtension } from '../utils/languageConfig'
import AddToCollectionModal from './addToCollectionModal'
import CreateCollectionModal from './createCollectionModal'

export default function SnippetCard({ snippet, collectionId, onRemoveFromCollection }) {
  const [isCopied, setIsCopied] = useState(false)
  const [forkLoading, setForkLoading] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [showForkConfirm, setShowForkConfirm] = useState(false)
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false)
  
  const { incrementCopy, toggleLike, forkSnippet, favoriteIds } = useSnippetStore()
  const { showAlert } = useAlertStore()
  const { theme } = useThemeStore()
  const { user } = useAuthStore()

  const isOwner = user?.id === snippet.user_id
  const isLiked = favoriteIds.includes(snippet.id)

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code)
    incrementCopy(snippet.id)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleDownload = () => {
    setShowDownloadConfirm(true)
  }

  const confirmDownload = () => {
    setShowDownloadConfirm(false)
    const extension = getFileExtension(snippet.language)
    // Buat nama file aman (hapus spasi/karakter aneh)
    const safeTitle = snippet.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const fileName = `${safeTitle}.${extension}`

    const blob = new Blob([snippet.code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    // Trigger download via anchor tag
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    
    // Cleanup
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    // Hitung sebagai 'copy' juga karena user mengambil kode
    incrementCopy(snippet.id)
    showAlert('success', 'Download Dimulai', `File ${fileName} sedang didownload.`)
  }

  const handleLikeClick = () => {
    // CEK LOGIN
    if (!user) {
        showAlert('error', 'Login Diperlukan', 'Silakan login terlebih dahulu untuk memberikan like.', true)
        return
    }
    toggleLike(snippet.id)
  }

  const handleForkClick = () => {
    // CEK LOGIN
    if (!user) {
        showAlert('error', 'Login Diperlukan', 'Silakan login terlebih dahulu untuk melakukan fork.', true)
        return
    }
    setShowForkConfirm(true)
  }

  const confirmFork = async () => {
    setShowForkConfirm(false)
    setForkLoading(true)
    try {
        await forkSnippet(snippet)
        showAlert('success', 'Fork Berhasil!', 'Snippet telah diduplikasi ke Dashboard Anda.')
    } catch (error) {
        showAlert('error', 'Gagal Fork', error.message)
    } finally {
        setForkLoading(false)
    }
  }

  const handleRemoveFromCollection = async () => {
    setShowRemoveConfirm(false)
    setRemoveLoading(true)
    try {
        if (onRemoveFromCollection) await onRemoveFromCollection(snippet.id)
    } catch (error) {
        showAlert('error', 'Gagal', 'Gagal menghapus snippet dari collection.')
    } finally {
        setRemoveLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col bg-white dark:bg-pastel-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-pastel-dark-border hover:shadow-2xl dark:hover:shadow-white/5 transition-all duration-300 overflow-hidden h-full group hover:-translate-y-1">
        
        {/* HEADER */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-white/5 flex justify-between items-start transition-colors">
          <div className="flex-1 pr-3">
            
            {!isOwner && snippet.profiles && (
                <Link to={`/user/${snippet.user_id}`} className="flex items-center gap-2 mb-2 group/author w-fit">
                    <div className="w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center overflow-hidden group-hover/author:ring-2 ring-pink-500 transition">
                        <UserIcon size={12} className="text-pink-500"/>
                    </div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 group-hover/author:text-pink-500 transition">
                        {snippet.profiles.full_name || 'Anonymous'}
                    </span>
                </Link>
            )}

            <Link to={`/snippet/${snippet.id}`} className="block">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white line-clamp-1 mb-2 group-hover:text-pink-500 transition-colors duration-300 cursor-pointer">
                    {snippet.title}
                </h3>
            </Link>
            
            <div className="flex items-center gap-2 flex-wrap">
                {isOwner && (
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        snippet.is_public 
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900' 
                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900'
                    }`}>
                        {snippet.is_public ? <Globe size={10} /> : <Lock size={10} />}
                        {snippet.is_public ? 'PUBLIC' : 'PRIVATE'}
                    </span>
                )}

                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-transparent ${getLangColor(snippet.language)}`}>
                    {snippet.language}
                </span>
                
                <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto sm:ml-0">
                    • {new Date(snippet.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button 
                onClick={handleLikeClick}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
                    isLiked 
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'text-gray-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-white/10'
                }`}
                title="Suka"
            >
                <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                {snippet.like_count > 0 && (
                    <span className="text-xs font-bold">{snippet.like_count}</span>
                )}
            </button>

            {!isOwner && (
                <button 
                    onClick={handleForkClick}
                    disabled={forkLoading}
                    className="p-2 text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-300 hover:rotate-12 disabled:opacity-50"
                    title="Fork ke Dashboard Saya"
                >
                    <GitFork size={18} className={forkLoading ? "animate-spin" : ""} />
                </button>
            )}

            {isOwner && collectionId && (
                <button 
                    onClick={() => setShowRemoveConfirm(true)}
                    disabled={removeLoading}
                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-300 disabled:opacity-50"
                    title="Hapus dari Collection ini"
                >
                    <FolderMinus size={18} className={removeLoading ? 'animate-pulse' : ''} />
                </button>
            )}

            {isOwner && !collectionId && (
                <button 
                    onClick={() => setShowCollectionModal(true)}
                    className="p-2 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-300"
                    title="Tambah ke Collection"
                >
                    <FolderPlus size={18} />
                </button>
            )}
          </div>
        </div>

        {/* BODY */}
        <Link to={`/snippet/${snippet.id}`} className={`relative flex-1 block cursor-pointer ${theme === 'dark' ? 'bg-[#282a36]' : 'bg-white'}`}>
            <CodeMirror 
                value={snippet.code} 
                height="300px" 
                theme={theme === 'dark' ? dracula : githubLight} 
                extensions={[getLanguageExtension(snippet.language)]}
                editable={false}
                basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
                className="text-sm"
            />
            <div className={`absolute bottom-0 left-0 right-0 p-3 flex gap-2 overflow-x-auto custom-scrollbar pt-8 ${
                theme === 'dark' 
                ? 'bg-gradient-to-t from-[#282a36] via-[#282a36]/80 to-transparent' 
                : 'bg-gradient-to-t from-white via-white/80 to-transparent'
            }`}>
                {snippet.tags && snippet.tags.map((tag, idx) => (
                    <span key={idx} className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm border whitespace-nowrap transition hover:scale-105 ${
                        theme === 'dark' ? 'text-gray-300 bg-white/10 border-white/5' : 'text-gray-600 bg-gray-100 border-gray-200'
                    }`}>
                        <Tag size={8} /> {tag}
                    </span>
                ))}
            </div>
        </Link>

        {/* FOOTER */}
        <div className="p-3 bg-white dark:bg-pastel-dark-surface border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2 transition-colors">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] text-gray-400 line-clamp-1 max-w-[70%]">
                    {snippet.description || "Tidak ada deskripsi"}
                </span>
                <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                    {snippet.copy_count || 0}x Salinan
                </span>
            </div>

            <div className="flex gap-2">
                <button 
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
                    title="Download Code"
                >
                    <Download size={18} />
                </button>
                <button 
                    onClick={handleCopy}
                    className={`flex-[3] flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold shadow-md transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 ${
                        isCopied 
                        ? 'bg-green-500 text-white shadow-green-500/30'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 dark:bg-blue-600 dark:hover:bg-blue-500'
                    }`}
                >
                    {isCopied ? <><Check size={18} className="animate-bounce" /> COPIED!</> : <><Copy size={18} /> Copy Code</>}
                </button>
            </div>
        </div>
      </div>

      {/* MODAL KONFIRMASI FORK */}
      {showForkConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-pastel-dark-surface w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 dark:border-pastel-dark-border p-6 transform transition-all animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                        <GitFork className="text-purple-500" size={20} />
                        Fork Snippet?
                    </h3>
                    <button 
                        onClick={() => setShowForkConfirm(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                    Anda akan menyalin snippet <strong>"{snippet.title}"</strong> ke dashboard pribadi Anda untuk dimodifikasi.
                </p>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowForkConfirm(false)}
                        className="flex-1 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={confirmFork}
                        className="flex-1 py-2.5 rounded-xl font-bold text-white bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/30 transition flex items-center justify-center gap-2"
                    >
                        <GitFork size={18} /> Ya, Fork
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS DARI COLLECTION */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-pastel-dark-surface w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 dark:border-pastel-dark-border p-6 transform transition-all animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                        <FolderMinus className="text-red-500" size={20} />
                        Hapus dari Collection?
                    </h3>
                    <button 
                        onClick={() => setShowRemoveConfirm(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                    Snippet <strong>"{snippet.title}"</strong> akan dihapus dari collection ini. Snippet tidak akan terhapus secara permanen.
                </p>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowRemoveConfirm(false)}
                        className="flex-1 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleRemoveFromCollection}
                        className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition flex items-center justify-center gap-2"
                    >
                        <FolderMinus size={18} /> Hapus
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL KONFIRMASI DOWNLOAD */}
      {showDownloadConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-pastel-dark-surface w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 dark:border-pastel-dark-border p-6 transform transition-all animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                        <Download className="text-blue-500" size={20} />
                        Konfirmasi Download?
                    </h3>
                    <button 
                        onClick={() => setShowDownloadConfirm(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                    File snippet <strong>"{snippet.title}"</strong> akan disimpan ke perangkat Anda.
                </p>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowDownloadConfirm(false)}
                        className="flex-1 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={confirmDownload}
                        className="flex-1 py-2.5 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/30 transition flex items-center justify-center gap-2"
                    >
                        <Download size={18} /> Unduh
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL ADD TO COLLECTION */}
      <AddToCollectionModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        snippetId={snippet.id}
        onCreateCollection={() => setShowCreateCollectionModal(true)}
      />
      <CreateCollectionModal
        isOpen={showCreateCollectionModal}
        onClose={() => setShowCreateCollectionModal(false)}
      />
    </>
  )
}