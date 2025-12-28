import { NavLink, useNavigate, Link } from 'react-router-dom'
import { LayoutGrid, Globe, LogOut, PlusCircle, Code, LogIn, X, Folder, ChevronDown, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useAlertStore } from '../store/alertStore'
import { useCollectionStore } from '../store/collectionStore'
import { useState, useEffect } from 'react'
import CreateCollectionModal from './createCollectionModal'

// Tambahkan props isOpen dan onClose untuk kontrol mobile
export default function Sidebar({ onOpenModal, isOpen, onClose, onSelectCollection }) {
  const { user, logout } = useAuthStore()
  const { showAlert } = useAlertStore()
  const { collections, fetchCollections } = useCollectionStore()
  const navigate = useNavigate()
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [collectionsExpanded, setCollectionsExpanded] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCollections()
    }
  }, [user, fetchCollections])

  const menus = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
    { name: 'Explore', path: '/explore', icon: Globe },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    setShowLogoutConfirm(false)
  }

  const handleNewSnippetClick = () => {
    if (!user) {
        showAlert('error', 'Login Diperlukan', 'Silakan login terlebih dahulu.')
        return
    }
    // Tutup sidebar di mobile saat menu diklik
    if (window.innerWidth < 1024) onClose() 
    onOpenModal()
  }

  const handleProtectedLink = (e, path) => {
    if (!user && path === '/dashboard') {
      e.preventDefault()
      showAlert('error', 'Login Diperlukan', 'Silakan login untuk mengakses Dashboard.')
    } else {
      // Tutup sidebar di mobile saat menu diklik
      if (window.innerWidth < 1024) onClose()
    }
  }

  return (
    <>
      {/* OVERLAY GELAP (Hanya muncul di Mobile saat sidebar terbuka) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* SIDEBAR CONTAINER */}
      <aside className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-pastel-dark-surface border-r border-gray-200 dark:border-pastel-dark-border flex flex-col z-30 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Header Logo */}
        <div className="p-6 flex items-center justify-between">
            <Link 
              to="/dashboard" 
              onClick={(e) => handleProtectedLink(e, '/dashboard')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
                <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-xl flex items-center justify-center text-pink-500 dark:text-pink-400 transition-colors">
                    <Code size={20} strokeWidth={3} />
                </div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight transition-colors">CodeHaven</h1>
            </Link>
            
            {/* Tombol Close (Mobile Only) */}
            <button onClick={onClose} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                <X size={20} />
            </button>
        </div>

        {/* Menu Utama */}
        <div className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={handleNewSnippetClick}
            className="w-full flex items-center gap-3 px-4 py-3 mb-6 bg-pink-500 dark:bg-pink-600 text-white rounded-xl font-semibold shadow-lg shadow-pink-500/30 dark:shadow-pink-600/20 hover:opacity-90 transition transform hover:-translate-y-0.5"
          >
            <PlusCircle size={20} />
            <span>New Snippet</span>
          </button>

          <p className="px-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 transition-colors">Menu</p>
          
          {menus.map((menu) => (
            <NavLink
              key={menu.name}
              to={menu.path}
              onClick={(e) => handleProtectedLink(e, menu.path)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive 
                    ? 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              <menu.icon size={20} />
              <span>{menu.name}</span>
            </NavLink>
          ))}

          {/* Collections Section */}
          {user && (
            <>
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setCollectionsExpanded(!collectionsExpanded)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <span>Collections</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowCollectionModal(true)
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded transition"
                      title="New Collection"
                    >
                      <PlusCircle size={14} />
                    </button>
                    {collectionsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </button>

                {collectionsExpanded && (
                  <div className="space-y-1 mt-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {collections.length === 0 ? (
                      <p className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 text-center">
                        Belum ada collection
                      </p>
                    ) : (
                      collections.map(collection => (
                        <button
                          key={collection.id}
                          onClick={() => {
                            onSelectCollection?.(collection.id)
                            if (window.innerWidth < 1024) onClose()
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-all"
                        >
                          <span>{collection.icon}</span>
                          <span className="flex-1 text-left truncate font-medium">{collection.name}</span>
                          <span className="text-xs text-gray-400">{collection.snippet_count || 0}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer User Profile */}
        <div className="p-4 border-t border-gray-200 dark:border-pastel-dark-border transition-colors">
          {user ? (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-transparent transition-colors">
              <Link to={`/user/${user?.id}`} onClick={() => window.innerWidth < 1024 && onClose()} className="flex items-center gap-3 flex-1 min-w-0 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold transition-colors shadow-sm overflow-hidden flex-shrink-0 group-hover:ring-2 ring-pink-500/50">
                  {user?.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                      user?.email?.charAt(0).toUpperCase() || 'U'
                  )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate transition-colors group-hover:text-pink-500">
                      {user?.user_metadata?.full_name || 'Developer'}
                  </p>
                  <p className="text-xs text-gray-400 truncate transition-colors">{user?.email}</p>
                  </div>
              </Link>
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer flex-shrink-0"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg hover:opacity-90 transition transform hover:-translate-y-0.5"
            >
              <LogIn size={20} />
              <span>Masuk Akun</span>
            </Link>
          )}
        </div>
      </aside>

      {/* MODAL LOGOUT (Tetap Sama) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-pastel-dark-surface w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 dark:border-pastel-dark-border p-6 transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-4">
                <LogOut size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Ingin Keluar?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">Anda perlu login kembali untuk mengakses koleksi kode Anda.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition">Batal</button>
                <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition flex items-center justify-center gap-2">Ya, Keluar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collection Modal */}
      <CreateCollectionModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
      />
    </>
  )
}