import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import AppLayout from '../components/appLayout'
import { useSnippetStore } from '../store/snippetStore'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { useAlertStore } from '../store/alertStore'
import { Loader2, Copy, Check, GitFork, Pencil, Heart, Share2, ArrowLeft, Calendar, User, Globe, Lock, Tag, Trash2, Save, AlertTriangle, Wand2, X, Download, Sparkles } from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { dracula } from '@uiw/codemirror-theme-dracula'
import { githubLight } from '@uiw/codemirror-theme-github'
import { getLanguageExtension, getLangColor, getFileExtension } from '../utils/languageConfig'
import LanguageSelector from '../components/languageSelector'
import { formatCode } from '../utils/formatCode'
import { analyzeCodeWithAI } from '../utils/AIService'

export default function DetailSnippet() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const { fetchSnippetById, incrementCopy, toggleLike, forkSnippet, favoriteIds, fetchMyFavoriteIds, updateSnippet, deleteSnippet } = useSnippetStore()
  const { user } = useAuthStore()
  const { theme } = useThemeStore()
  const { showAlert } = useAlertStore()

  const handleSelectCollection = (collectionId) => {
    navigate('/dashboard', { state: { selectedCollection: collectionId } })
  }

  // --- STATE ---
  const [snippet, setSnippet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [forkLoading, setForkLoading] = useState(false)
  
  // State Mode Edit
  const [isEditing, setIsEditing] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [isFormatting, setIsFormatting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // State Data Form
  const [formData, setFormData] = useState({
    title: '',
    language: 'javascript',
    code: '',
    description: '',
    tagsInput: '',
    is_public: false,
    // Enhanced Metadata
    dependencies: [],
    dependencyInput: '',
    usageExample: '',
    documentationUrl: ''
  })

  // State Modal Konfirmasi
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showForkConfirm, setShowForkConfirm] = useState(false)
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false)

  // --- EFFECT: LOAD DATA ---
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true)
      try {
        if (!id) throw new Error("ID tidak valid");
        const data = await fetchSnippetById(id)
        
        if (!isMounted) return;

        if (data) {
          setSnippet(data)
          fetchMyFavoriteIds().catch(err => console.warn(err))
        } else {
          showAlert('error', 'Tidak Ditemukan', 'Snippet yang Anda cari tidak ada atau telah dihapus.')
          navigate('/dashboard')
        }
      } catch (error) {
        if (isMounted) {
            console.error(error)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => { isMounted = false }
  }, [id])

  if (loading) {
    return (
      <AppLayout onSelectCollection={handleSelectCollection}>
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-pastel-primary" size={40} />
        </div>
      </AppLayout>
    )
  }

  if (!snippet) return null

  const isOwner = user?.id === snippet.user_id
  const isLiked = favoriteIds.includes(snippet.id)

  // --- HANDLERS UTAMA ---

  const handleCopy = () => {
    const codeToCopy = isEditing ? formData.code : snippet.code
    navigator.clipboard.writeText(codeToCopy)
    if (!isEditing) {
        incrementCopy(snippet.id)
    }
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleDownload = () => {
    setShowDownloadConfirm(true)
  }

  const confirmDownload = () => {
    setShowDownloadConfirm(false)
    const extension = getFileExtension(isEditing ? formData.language : snippet.language)
    // Buat nama file aman
    const title = isEditing ? formData.title : snippet.title
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const fileName = `${safeTitle}.${extension}`

    const code = isEditing ? formData.code : snippet.code
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    incrementCopy(snippet.id)
    showAlert('success', 'Download Dimulai', `File ${fileName} sedang didownload.`)
  }

  const handleFormat = async () => {
    setIsFormatting(true)
    try {
      const formatted = await formatCode(formData.code, formData.language)
      setFormData(prev => ({ ...prev, code: formatted }))
    } catch (error) {
      console.warn("Format gagal", error)
      showAlert('error', 'Gagal Format', 'Pastikan sintaks kode benar sebelum diformat.')
    } finally {
      setIsFormatting(false)
    }
  }

  // --- HANDLER AI AUTOFILL ---
  const handleAnalyzeCode = async () => {
    if (!formData.code || formData.code.length < 10) {
      showAlert('error', 'Kode Kosong', 'Masukkan kode terlebih dahulu agar AI bisa menganalisis.')
      return
    }

    setIsAnalyzing(true)
    try {
      const result = await analyzeCodeWithAI(formData.code)
      
      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        language: result.language || prev.language,
        description: result.description || prev.description,
        tagsInput: result.tags?.join(', ') || prev.tagsInput,
        dependencies: result.dependencies?.length > 0 ? result.dependencies : prev.dependencies,
        usageExample: result.usage_example || prev.usageExample
      }))
      
      showAlert('success', 'AI Selesai!', 'Metadata telah diupdate dari analisis kode.')
    } catch (error) {
      console.error(error)
      showAlert('error', 'Gagal Analisis', error.message || 'Terjadi kesalahan pada AI.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleLike = async () => {
    if (!user) {
        showAlert('error', 'Login Diperlukan', 'Silakan login terlebih dahulu untuk menyukai snippet ini.', true)
        return
    }

    await toggleLike(snippet.id)
    setSnippet(prev => ({
        ...prev,
        like_count: (prev.like_count || 0) + (isLiked ? -1 : 1)
    }))
  }

  // Klik tombol Fork -> Buka Modal
  const handleForkClick = () => {
    if (!user) {
        showAlert('error', 'Login Diperlukan', 'Silakan login untuk melakukan fork.', true)
        return
    }
    setShowForkConfirm(true)
  }

  // Eksekusi Fork (Dipanggil dari Modal)
  const confirmFork = async () => {
    setShowForkConfirm(false)
    setForkLoading(true)
    try {
      await forkSnippet(snippet)
      showAlert('success', 'Fork Berhasil!', 'Snippet telah diduplikasi ke Dashboard Anda.')
      navigate('/dashboard') 
    } catch (error) {
      showAlert('error', 'Gagal Fork', error.message)
    } finally {
      setForkLoading(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    showAlert('success', 'Link Disalin', 'URL tersalin ke clipboard.')
  }

  // --- HANDLERS EDIT ---

  const startEditing = () => {
    setFormData({
      title: snippet.title,
      language: snippet.language,
      code: snippet.code,
      description: snippet.description || '',
      tagsInput: snippet.tags ? snippet.tags.join(', ') : '',
      is_public: snippet.is_public,
      // Enhanced Metadata
      dependencies: snippet.dependencies || [],
      dependencyInput: '',
      usageExample: snippet.usage_example || '',
      documentationUrl: snippet.documentation_url || ''
    })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
  }

  const saveChanges = async (e) => {
    e.preventDefault()
    setEditLoading(true)
    try {
      const tagsArray = formData.tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0)
      
      const updatedData = {
        title: formData.title,
        language: formData.language,
        code: formData.code,
        description: formData.description,
        is_public: formData.is_public,
        tags: tagsArray,
        // Enhanced Metadata
        dependencies: formData.dependencies.length > 0 ? formData.dependencies : null,
        usage_example: formData.usageExample.trim() || null,
        documentation_url: formData.documentationUrl.trim() || null
      }

      await updateSnippet(snippet.id, updatedData)
      setSnippet(prev => ({ ...prev, ...updatedData }))
      setIsEditing(false)
      showAlert('success', 'Berhasil', 'Perubahan disimpan.')
    } catch (error) {
      showAlert('error', 'Gagal Update', error.message)
    } finally {
      setEditLoading(false)
    }
  }

  // --- HANDLERS DELETE ---

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setShowDeleteConfirm(false)
    try {
      await deleteSnippet(snippet.id)
      showAlert('success', 'Terhapus', 'Snippet dihapus.')
      navigate('/dashboard')
    } catch (error) {
      showAlert('error', 'Gagal Hapus', error.message)
    }
  }

  return (
    <AppLayout onSelectCollection={handleSelectCollection}>
      <div className="max-w-5xl mx-auto pb-20">
        
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-pastel-primary dark:text-gray-400 dark:hover:text-white transition group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
          Kembali
        </button>

        <form onSubmit={saveChanges}> 
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex-1 w-full">
            
            {isEditing ? (
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full text-3xl md:text-4xl font-bold bg-white dark:bg-[#252a33] border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none mb-4 transition-all shadow-sm"
                placeholder="Judul Snippet"
                required
              />
            ) : (
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight">
                {snippet.title}
              </h1>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              
              <Link to={`/user/${snippet.user_id}`} className="flex items-center gap-2 group/author hover:text-pink-500 transition-colors bg-white dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center overflow-hidden group-hover/author:ring-2 ring-pink-500 transition">
                    {snippet.profiles?.avatar_url ? (
                        <img src={snippet.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover"/>
                    ) : (
                        <User size={12} className="text-pink-500"/>
                    )}
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300 group-hover/author:text-pink-500 transition">
                    {snippet.profiles?.full_name || 'Anonymous'}
                </span>
              </Link>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-700">
                <Calendar size={14} />
                {new Date(snippet.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>

              {isEditing ? (
                <div className="relative">
                    <select 
                    value={formData.is_public} 
                    onChange={(e) => setFormData({...formData, is_public: e.target.value === 'true'})} 
                    className="appearance-none pl-8 pr-8 py-1.5 bg-white dark:bg-[#252a33] border border-gray-300 dark:border-gray-600 text-sm rounded-full outline-none focus:ring-2 focus:ring-pink-500"
                    >
                    <option value="false">Private</option>
                    <option value="true">Public</option>
                    </select>
                    {formData.is_public ? (
                        <Globe size={14} className="absolute left-2.5 top-2 text-green-500 pointer-events-none" />
                    ) : (
                        <Lock size={14} className="absolute left-2.5 top-2 text-red-500 pointer-events-none" />
                    )}
                </div>
              ) : (
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${
                    snippet.is_public 
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900' 
                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900'
                }`}>
                    {snippet.is_public ? <Globe size={12} /> : <Lock size={12} />}
                    {snippet.is_public ? 'PUBLIC' : 'PRIVATE'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isEditing ? (
              <>
                <button type="button" onClick={handleShare} className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition hover:scale-105 active:scale-95 shadow-sm" title="Bagikan Link"><Share2 size={20} /></button>
                
                <button type="button" onClick={handleDownload} className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition hover:scale-105 active:scale-95 shadow-sm" title="Download Snippet"><Download size={20} /></button>
                
                <button 
                    type="button"
                    onClick={handleLike}
                    className={`px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 transition flex items-center gap-2 hover:scale-105 active:scale-95 shadow-sm font-semibold ${
                        isLiked 
                        ? 'text-red-500 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-white/5'
                    }`}
                >
                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                    <span>{snippet.like_count || 0}</span>
                </button>

                {!isOwner && (
                  <button 
                    type="button"
                    onClick={handleForkClick}
                    disabled={forkLoading}
                    className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/30 transition flex items-center gap-2 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
                  >
                    {forkLoading ? <Loader2 className="animate-spin" size={20} /> : <GitFork size={20} />}
                    Fork
                  </button>
                )}

                {isOwner && (
                  <>
                    <button type="button" onClick={handleDeleteClick} className="p-3 text-red-500 border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition hover:scale-105 active:scale-95 shadow-sm" title="Hapus Snippet"><Trash2 size={20} /></button>
                    <button type="button" onClick={startEditing} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition flex items-center gap-2 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"><Pencil size={18} /> Edit</button>
                  </>
                )}
              </>
            ) : (
              <>
                <button type="button" onClick={cancelEditing} disabled={editLoading} className="px-5 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl font-medium transition">Batal</button>
                <button type="submit" disabled={editLoading} className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 transition flex items-center gap-2 hover:-translate-y-0.5 active:scale-95">{editLoading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Simpan</>}</button>
              </>
            )}
          </div>
        </div>

        <div className={`bg-white dark:bg-pastel-dark-surface rounded-2xl shadow-xl border border-gray-200 dark:border-pastel-dark-border overflow-hidden transition-all duration-300 ${isEditing ? 'ring-4 ring-blue-500/20 border-blue-400 dark:border-blue-500' : ''}`}>
          <div className="flex flex-wrap items-center justify-between px-4 md:px-6 py-3 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-gray-800 gap-3">
            {isEditing ? (
               <div className="w-full md:w-56"><LanguageSelector value={formData.language} onChange={(val) => setFormData({...formData, language: val})} /></div>
            ) : (
               <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm border border-black/5 ${getLangColor(snippet.language)}`}>{snippet.language}</span>
            )}
            
            <div className="flex items-center gap-2 ml-auto">
                {isEditing && (
                    <>
                      <button type="button" onClick={handleFormat} disabled={isFormatting} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition disabled:opacity-50"><Wand2 size={14} className={isFormatting ? "animate-spin" : ""} />{isFormatting ? "Formatting..." : "Format Code"}</button>
                      <button 
                        type="button" 
                        onClick={handleAnalyzeCode} 
                        disabled={isAnalyzing} 
                        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg hover:brightness-110 hover:-translate-y-0.5 transition transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isAnalyzing ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14} />}
                        {isAnalyzing ? "Menganalisis..." : "Metadata Autofill"}
                      </button>
                    </>
                )}
                <button type="button" onClick={handleDownload} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition border text-gray-600 bg-white border-gray-200 hover:border-pastel-primary hover:text-pastel-primary dark:text-gray-300 dark:bg-white/5 dark:border-gray-700 dark:hover:text-white" title="Download File"><Download size={16} /> Download</button>
                <button type="button" onClick={handleCopy} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition border ${isCopied ? 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900' : 'text-gray-600 bg-white border-gray-200 hover:border-pastel-primary hover:text-pastel-primary dark:text-gray-300 dark:bg-white/5 dark:border-gray-700 dark:hover:text-white'}`}>{isCopied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy Raw</>}</button>
            </div>
          </div>

          <div className="relative group">
            <CodeMirror value={isEditing ? formData.code : snippet.code} theme={theme === 'dark' ? dracula : githubLight} extensions={[getLanguageExtension(isEditing ? formData.language : snippet.language)]} editable={isEditing} onChange={(val) => isEditing && setFormData({...formData, code: val})} basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: isEditing }} className="text-sm min-h-[400px]" />
            {!isEditing && <div className="absolute top-2 right-4 opacity-0 group-hover:opacity-50 transition pointer-events-none"><span className="text-[10px] text-gray-400 bg-black/80 px-2 py-1 rounded">Read Only</span></div>}
          </div>

          <div className="p-6 md:p-8 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-pastel-dark-surface">
            <div className="mb-8">
                <h3 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Deskripsi</h3>
                {isEditing ? (
                <textarea rows="4" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500/50 dark:text-white focus:outline-none transition resize-none" placeholder="Tambahkan catatan tentang kode ini..." />
                ) : (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{snippet.description || <span className="italic text-gray-400">Tidak ada deskripsi tambahan.</span>}</p>
                )}
            </div>

            {/* Enhanced Metadata - Edit Mode Only */}
            {isEditing && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="text-indigo-500">✨</span>
                    Enhanced Metadata
                </h3>

                {/* Dependencies */}
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Dependencies</label>
                    <div className="flex gap-2 mb-2">
                        <input 
                            type="text"
                            value={formData.dependencyInput}
                            onChange={(e) => setFormData({...formData, dependencyInput: e.target.value})}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && formData.dependencyInput.trim()) {
                                    e.preventDefault()
                                    if (!formData.dependencies.includes(formData.dependencyInput.trim())) {
                                        setFormData({
                                          ...formData, 
                                          dependencies: [...formData.dependencies, formData.dependencyInput.trim()],
                                          dependencyInput: ''
                                        })
                                    } else {
                                      setFormData({...formData, dependencyInput: ''})
                                    }
                                }
                            }}
                            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 dark:text-white focus:outline-none transition placeholder-gray-400"
                            placeholder="e.g., react, axios (Enter to add)"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.dependencies.map((dep, idx) => (
                            <span 
                                key={idx}
                                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium flex items-center gap-1"
                            >
                                📦 {dep}
                                <button
                                    type="button"
                                    onClick={() => setFormData({
                                      ...formData,
                                      dependencies: formData.dependencies.filter((_, i) => i !== idx)
                                    })}
                                    className="hover:text-red-500 transition"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Usage Example */}
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Usage Example</label>
                    <textarea 
                        rows="3"
                        value={formData.usageExample}
                        onChange={(e) => setFormData({...formData, usageExample: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 dark:text-white focus:outline-none transition placeholder-gray-400 font-mono text-sm"
                        placeholder="const value = useDebounce(input, 500)"
                    />
                </div>

                {/* Documentation URL */}
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Documentation Link</label>
                    <input 
                        type="url"
                        value={formData.documentationUrl}
                        onChange={(e) => setFormData({...formData, documentationUrl: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 dark:text-white focus:outline-none transition placeholder-gray-400"
                        placeholder="https://react.dev/reference/..."
                    />
                </div>
              </div>
            )}

            <div>
                <h3 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tags</h3>
                {(isEditing || (snippet.tags && snippet.tags.length > 0)) && (
                    <>
                        {isEditing ? (
                        <div className="relative max-w-md">
                            <Tag className="absolute left-3 top-3 text-gray-400" size={16} />
                            <input type="text" value={formData.tagsInput} onChange={(e) => setFormData({...formData, tagsInput: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500/50 dark:text-white focus:outline-none transition" placeholder="Pisahkan dengan koma (contoh: react, hook)..." />
                            <p className="text-[10px] text-gray-400 mt-1 ml-2">Gunakan koma untuk memisahkan tag.</p>
                        </div>
                        ) : (
                        <div className="flex flex-wrap gap-2">
                            {snippet.tags.map((tag, idx) => (<span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-lg text-sm border border-gray-200 dark:border-gray-700 hover:border-pastel-primary transition cursor-default"><Tag size={14} className="text-gray-400" /> {tag}</span>))}
                        </div>
                        )}
                    </>
                )}
            </div>
          </div>
        </div>
        
        </form>

      </div>

      {/* MODAL KONFIRMASI DELETE */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-pastel-dark-surface w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 dark:border-pastel-dark-border p-6 transform transition-all animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-4 animate-bounce-slow"><AlertTriangle size={28} /></div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hapus Permanen?</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">Snippet <strong>"{snippet.title}"</strong> akan dihapus selamanya dan tidak dapat dikembalikan.</p>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition">Batal</button>
                        <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition flex items-center justify-center gap-2 transform active:scale-95"><Trash2 size={18} /> Ya, Hapus</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* MODAL KONFIRMASI FORK */}
      {showForkConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-pastel-dark-surface w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 dark:border-pastel-dark-border p-6 transform transition-all animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2"><GitFork className="text-purple-500" size={24} /> Fork Snippet?</h3>
                    <button onClick={() => setShowForkConfirm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"><X size={20} /></button>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">Anda akan menyalin snippet <strong>"{snippet.title}"</strong> ke dashboard pribadi Anda untuk dimodifikasi.</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowForkConfirm(false)} className="flex-1 py-3 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition">Batal</button>
                    <button onClick={confirmFork} className="flex-1 py-3 rounded-xl font-bold text-white bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/30 transition flex items-center justify-center gap-2 transform active:scale-95"><GitFork size={18} /> Ya, Fork</button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL KONFIRMASI DOWNLOAD */}
      {showDownloadConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-pastel-dark-surface w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 dark:border-pastel-dark-border p-6 transform transition-all animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2"><Download className="text-blue-500" size={24} /> Download Snippet?</h3>
                    <button onClick={() => setShowDownloadConfirm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"><X size={20} /></button>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">Anda akan mengunduh snippet <strong>"{snippet.title}"</strong> sebagai file.</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowDownloadConfirm(false)} className="flex-1 py-3 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition">Batal</button>
                    <button onClick={confirmDownload} className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/30 transition flex items-center justify-center gap-2 transform active:scale-95"><Download size={18} /> Ya, Unduh</button>
                </div>
            </div>
        </div>
      )}

    </AppLayout>
  )
}
