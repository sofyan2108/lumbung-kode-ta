import { X, Code2, Loader2, Tag, Wand2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { dracula } from '@uiw/codemirror-theme-dracula'
import { githubLight } from '@uiw/codemirror-theme-github'
import { useSnippetStore } from '../store/snippetStore'
import { useAlertStore } from '../store/alertStore'
import { useThemeStore } from '../store/themeStore'
import { getLanguageExtension } from '../utils/languageConfig'
import LanguageSelector from './languageSelector'
import { useShortcut } from '../hooks/useShortcut'
import { formatCode } from '../utils/formatCode'
import { analyzeCodeWithAI } from '../utils/AIService'

export default function AddSnippetModal({ isOpen, onClose }) {
  const { addSnippet } = useSnippetStore()
  const { showAlert } = useAlertStore()
  const { theme } = useThemeStore()
  
  const [loading, setLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false) // State loading AI
  const [isFormatting, setIsFormatting] = useState(false) // State loading Format
  
  // State Form
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('') // Default kosong agar user wajib pilih/AI detect
  const [code, setCode] = useState('// Paste kodemu di sini...')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  
  // Enhanced Metadata
  const [dependencies, setDependencies] = useState([])
  const [dependencyInput, setDependencyInput] = useState('')
  const [usageExample, setUsageExample] = useState('')
  const [documentationUrl, setDocumentationUrl] = useState('')

  // --- KONSTANTA VALIDASI ---
  const MAX_TITLE_LENGTH = 100
  const MAX_CODE_LENGTH = 20000
  const MAX_DESC_LENGTH = 500

  // --- LOGIKA AI (GEMINI) ---
  const handleAnalyzeCode = async () => {
    // Validasi kode minimal
    if (!code || code.length < 10 || code.includes('Paste kodemu')) {
        showAlert('error', 'Kode Kosong', 'Tempelkan kode programmu terlebih dahulu agar AI bisa membacanya.')
        return
    }

    setIsAnalyzing(true)
    try {
        const result = await analyzeCodeWithAI(code)
        
        // Auto-fill form dari hasil analisis AI
        setTitle(result.title)
        setLanguage(result.language)
        setDescription(result.description)
        setTagsInput(result.tags.join(', '))
        
        // Enhanced metadata from AI
        if (result.dependencies && result.dependencies.length > 0) {
            setDependencies(result.dependencies)
        }
        if (result.usage_example) {
            setUsageExample(result.usage_example)
        }
        
        showAlert('success', 'AI Selesai!', 'Judul, bahasa, dan tag telah diisi otomatis.')
    } catch (error) {
        console.error(error)
        showAlert('error', 'Gagal Analisis', error.message || 'Terjadi kesalahan pada AI.')
    } finally {
        setIsAnalyzing(false)
    }
  }

  // --- LOGIKA FORMATTER (PRETTIER) ---
  const handleFormat = async () => {
    if (!language) {
        showAlert('error', 'Pilih Bahasa', 'Bahasa harus terisi agar formatter bekerja.')
        return
    }

    setIsFormatting(true)
    try {
      const formatted = await formatCode(code, language)
      setCode(formatted)
    } catch (error) {
      console.warn("Format gagal", error)
    } finally {
      setIsFormatting(false)
    }
  }

  // --- LOGIKA SUBMIT ---
  const performSubmit = async () => {
    // 1. Validasi Input Kosong
    if (!title.trim()) {
        showAlert('error', 'Validasi', 'Judul snippet wajib diisi.')
        return
    }
    if (!language.trim()) {
        showAlert('error', 'Validasi', 'Bahasa pemrograman wajib dipilih.')
        return
    }
    if (!code.trim() || code.includes('Paste kodemu')) {
        showAlert('error', 'Validasi', 'Kode tidak boleh kosong.')
        return
    }

    // 2. Validasi Panjang (Security)
    if (title.length > MAX_TITLE_LENGTH) {
        showAlert('error', 'Judul Panjang', `Maksimal ${MAX_TITLE_LENGTH} karakter.`)
        return
    }
    if (code.length > MAX_CODE_LENGTH) {
        showAlert('error', 'Kode Besar', `Snippet terlalu besar (maksimal ${MAX_CODE_LENGTH} karakter).`)
        return
    }

    setLoading(true)
    try {
      const tagsArray = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, 5) // Batasi 5 tag

      await addSnippet({
        title: title.trim(),
        language: language.toLowerCase(),
        code: code.trim(),
        description: description.trim(),
        tags: tagsArray,
        is_public: isPublic,
        // Enhanced Metadata
        dependencies: dependencies.length > 0 ? dependencies : null,
        usage_example: usageExample.trim() || null,
        documentation_url: documentationUrl.trim() || null
      })
      
      // Reset Form
      setTitle('')
      setCode('// Paste kodemu di sini...')
      setDescription('')
      setTagsInput('')
      setLanguage('')
      setIsPublic(false)
      // Reset metadata
      setDependencies([])
      setDependencyInput('')
      setUsageExample('')
      setDocumentationUrl('')
      
      onClose()
      showAlert('success', 'Tersimpan!', 'Snippet baru berhasil ditambahkan.')
    } catch (error) {
      showAlert('error', 'Gagal Simpan', error.message)
    } finally {
      setLoading(false)
    }
  }

  // --- KEYBOARD SHORTCUTS ---
  useShortcut('s', () => {
    if (isOpen && !loading) performSubmit()
  }, { ctrlKey: true })

  useShortcut('Escape', () => {
    if (isOpen) onClose()
  }, { ctrlKey: false })

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    performSubmit()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
      
      <div className="bg-white dark:bg-pastel-dark-surface w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-pastel-dark-border overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-pastel-dark-border bg-gray-50 dark:bg-white/5">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
            <Sparkles size={20} className="text-pink-500 animate-pulse" />
            Tambah Snippet Baru
          </h3>
          <div className="flex items-center gap-2">
             <span className="hidden sm:inline-block text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                ESC to close
             </span>
             <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400 hover:rotate-90 duration-300">
                <X size={20} />
             </button>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
            {/* 1. SECTION EDITOR KODE (Code-First) */}
            <div>
              <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2 block">1. Masukkan Kode</label>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-inner group-focus-within:ring-2 ring-pink-500/20 transition">
                <CodeMirror 
                  value={code} 
                  height="250px" 
                  theme={theme === 'dark' ? dracula : githubLight} 
                  extensions={[getLanguageExtension(language)]} 
                  onChange={(val) => setCode(val)}
                />
              </div>
              <div className="text-right mt-1">
                 <span className={`text-[10px] ${code.length > MAX_CODE_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                    {code.length} / {MAX_CODE_LENGTH} chars
                 </span>
              </div>
            </div>

            {/* Divider Estetik */}
            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-wider font-semibold">Metadata Snippet</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            {/* 2. HASIL GENERATE / MANUAL INPUT */}
            {/* Tombol AI - muncul setelah divider, langsung di atas form metadata */}
            <div className="flex justify-end">
                <button 
                    type="button" 
                    onClick={handleAnalyzeCode}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg hover:brightness-110 hover:-translate-y-0.5 transition transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isAnalyzing ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14} />}
                    {isAnalyzing ? "Menganalisis..." : "Metadata Autofill"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Judul */}
                <div>
                    <div className="flex justify-between">
                        <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Judul</label>
                        <span className={`text-[10px] ${title.length > MAX_TITLE_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>{title.length}/{MAX_TITLE_LENGTH}</span>
                    </div>
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500/50 dark:text-white focus:outline-none transition placeholder-gray-400"
                        placeholder="Judul otomatis..."
                        maxLength={MAX_TITLE_LENGTH}
                    />
                </div>

                {/* Bahasa */}
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Bahasa</label>
                    <LanguageSelector value={language} onChange={setLanguage} />
                </div>
            </div>

            {/* Tags & Visibilitas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Tags (Max 5)</label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500/50 dark:text-white focus:outline-none transition placeholder-gray-400"
                            placeholder="tag1, tag2..."
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Visibilitas</label>
                    <select 
                      value={isPublic}
                      onChange={(e) => setIsPublic(e.target.value === 'true')}
                      className="w-full px-4 py-2 bg-white dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500/50 dark:text-white focus:outline-none transition cursor-pointer"
                    >
                      <option value="false">Private (Hanya Saya)</option>
                      <option value="true">Public (Masuk Forum)</option>
                    </select>
                </div>
            </div>

            {/* Deskripsi */}
            <div>
                <div className="flex justify-between">
                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Deskripsi</label>
                    <span className={`text-[10px] ${description.length > MAX_DESC_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>{description.length}/{MAX_DESC_LENGTH}</span>
                </div>
                <textarea 
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500/50 dark:text-white focus:outline-none resize-none transition placeholder-gray-400"
                    placeholder="Penjelasan singkat..."
                    maxLength={MAX_DESC_LENGTH}
                />
            </div>

            {/* Enhanced Metadata Section */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-500" />
                    Enhanced Metadata (Optional)
                </h3>

                {/* Dependencies */}
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                        Dependencies (Library yang dipakai)
                    </label>
                    <div className="flex gap-2 mb-2">
                        <input 
                            type="text"
                            value={dependencyInput}
                            onChange={(e) => setDependencyInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && dependencyInput.trim()) {
                                    e.preventDefault()
                                    if (!dependencies.includes(dependencyInput.trim())) {
                                        setDependencies([...dependencies, dependencyInput.trim()])
                                    }
                                    setDependencyInput('')
                                }
                            }}
                            className="flex-1 px-4 py-2 bg-white dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 dark:text-white focus:outline-none transition placeholder-gray-400"
                            placeholder="e.g., react, axios, lodash (Enter to add)"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {dependencies.map((dep, idx) => (
                            <span 
                                key={idx}
                                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium flex items-center gap-1"
                            >
                                📦 {dep}
                                <button
                                    type="button"
                                    onClick={() => setDependencies(dependencies.filter((_, i) => i !== idx))}
                                    className="hover:text-red-500 transition"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        {dependencies.length === 0 && (
                            <span className="text-xs text-gray-400 italic">AI akan detect otomatis saat analyze code</span>
                        )}
                    </div>
                </div>

                {/* Usage Example */}
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                        Usage Example (Cara pakai)
                    </label>
                    <textarea 
                        rows="4"
                        value={usageExample}
                        onChange={(e) => setUsageExample(e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 dark:text-white focus:outline-none transition placeholder-gray-400 font-mono text-sm"
                        placeholder="const data = useDebounce(value, 500)"
                    />
                </div>

                {/* Documentation URL */}
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                        Documentation Link
                    </label>
                    <input 
                        type="url"
                        value={documentationUrl}
                        onChange={(e) => setDocumentationUrl(e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 dark:text-white focus:outline-none transition placeholder-gray-400"
                        placeholder="https://react.dev/reference/..."
                    />
                </div>
            </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-pastel-dark-border flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg font-medium transition hover:scale-105 active:scale-95"
          >
            Batal
          </button>
          <button 
            onClick={performSubmit}
            disabled={loading}
            className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-bold shadow-lg shadow-pink-500/30 transition-all flex items-center gap-2 hover:-translate-y-0.5 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : 'Simpan'}
          </button>
        </div>

      </div>
    </div>
  )
}