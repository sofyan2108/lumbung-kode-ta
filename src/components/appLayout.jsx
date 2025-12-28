import { useState } from 'react'
import Sidebar from './sidebar'
import TopBar from './topBar'
import AddSnippetModal from './addSnippetModal'
import GlobalAlert from './globalAlert'

export default function AppLayout({ children, onSelectCollection }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // State untuk Sidebar (Default Open di Desktop, Closed di Mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
        return window.innerWidth >= 1024
    }
    return false
  })

  // Handle toggle sidebar
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="flex min-h-screen bg-pastel-bg dark:bg-pastel-dark-bg font-sans text-pastel-text dark:text-pastel-dark-text transition-colors duration-300 overflow-x-hidden">
      
      {/* GLOBAL ALERT (Notifikasi) */}
      <GlobalAlert />

      {/* SIDEBAR */}
      <Sidebar 
        onOpenModal={() => setIsModalOpen(true)} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectCollection={onSelectCollection}
      />
      
      {/* MAIN CONTENT */}
      {/* 'min-w-0' mencegah flex item melebar paksa melebihi container */}
      {/* Adjust margin-left based on sidebar state */}
      <main 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >
        
        {/* TopBar Wrapper */}
        <div className="sticky top-0 z-10 flex flex-col">
            <TopBar onMenuClick={toggleSidebar} />
        </div>

        {/* Konten Halaman */}
        <div className="p-4 md:p-8 pt-4 flex-1">
          {children}
        </div>
      </main>

      {/* Modal Snippet */}
      <AddSnippetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  )
}