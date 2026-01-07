import { Link } from 'react-router-dom'
import { Code, Share2, GitFork, Heart, ArrowRight, Layout, Moon, Sun, LayoutDashboard, Terminal } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore' // 1. Import Auth Store

export default function LandingPage() {
  const { theme, toggleTheme } = useThemeStore()
  const { user } = useAuthStore() // 2. Ambil status user

  return (
    <div className="min-h-screen bg-pastel-bg dark:bg-pastel-dark-bg text-pastel-text dark:text-pastel-dark-text transition-colors duration-300 font-sans selection:bg-pink-500 selection:text-white animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* NAVBAR */}
      <nav className="px-6 py-6 max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
            <Code size={24} strokeWidth={3} />
          </div>
          <span className="text-xl font-bold tracking-tight">Lumbung Kode</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10 rounded-full transition"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <Link to="/cli-docs" className="hidden sm:flex items-center gap-1.5 font-semibold hover:text-pink-500 transition">
            <Terminal size={18} />
            CLI
          </Link>

          {/* 3. Logika Tombol Navbar */}
          {user ? (
            <Link to="/dashboard" className="px-5 py-2.5 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 shadow-lg shadow-pink-500/20 transition flex items-center gap-2">
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="font-semibold hover:text-pink-500 transition hidden sm:block">Masuk</Link>
              <Link to="/login" className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:opacity-90 transition">
                Daftar Sekarang
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="max-w-7xl mx-auto px-6 py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Kiri: Teks */}
        <div className="flex-1 text-center lg:text-left space-y-8 animate-in slide-in-from-left-8 fade-in duration-1000 delay-100 fill-mode-backwards">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
            V1.0 Release
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight text-gray-900 dark:text-white">
            Rumah untuk <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Snippet Kodemu.</span>
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Simpan, kelola, dan bagikan potongan kode favoritmu dengan mudah. 
            Fitur sosial untuk developer modern yang mengutamakan estetika.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            {/* 4. Logika Tombol Hero */}
            {user ? (
                <Link to="/dashboard" className="px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold shadow-xl shadow-pink-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                  <LayoutDashboard size={20} />
                  Buka Dashboard
                </Link>
            ) : (
                <Link to="/login" className="px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold shadow-xl shadow-pink-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                  Mulai Gratis <ArrowRight size={20} />
                </Link>
            )}
            
            <Link to="/explore" className="px-8 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 hover:border-pink-500 dark:hover:border-pink-500 text-gray-700 dark:text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
              Lihat Explore
            </Link>
          </div>

          <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-gray-400 text-sm font-medium">
            <span className="flex items-center gap-2"><CheckMark /> Free Forever</span>
            <span className="flex items-center gap-2"><CheckMark /> No Credit Card</span>
          </div>
        </div>

        {/* Kanan: Ilustrasi/Mockup */}
        <div className="flex-1 relative w-full max-w-lg lg:max-w-xl animate-in slide-in-from-right-8 fade-in duration-1000 delay-300 fill-mode-backwards">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-500/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-2xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 dark:bg-yellow-500/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-500/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-2xl opacity-70 animate-blob animation-delay-4000"></div>
            
            <div className="relative bg-white/80 dark:bg-[#1e1e1e]/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition duration-500">
                <div className="flex gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-3 font-mono text-sm">
                    <div className="flex gap-2"><span className="text-gray-400">1</span> <span className="text-purple-500">const</span> <span className="text-blue-500">lumbungKode</span> = <span className="text-yellow-500">{'{'}</span></div>
                    <div className="flex gap-2"><span className="text-gray-400">2</span> &nbsp;&nbsp;<span className="text-red-500">beautiful</span>: <span className="text-blue-400">true</span>,</div>
                    <div className="flex gap-2"><span className="text-gray-400">3</span> &nbsp;&nbsp;<span className="text-red-500">useful</span>: <span className="text-blue-400">true</span>,</div>
                    <div className="flex gap-2"><span className="text-gray-400">4</span> &nbsp;&nbsp;<span className="text-red-500">developer</span>: <span className="text-green-500">"Happy"</span></div>
                    <div className="flex gap-2"><span className="text-gray-400">5</span> <span className="text-yellow-500">{'}'}</span>;</div>
                </div>
            </div>
        </div>
      </main>

      {/* FEATURE GRID */}
      <section className="max-w-7xl mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 fill-mode-backwards">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
                icon={<Layout className="text-blue-500" />} 
                title="Manajemen Rapi" 
                desc="Simpan snippet dengan tag, bahasa, dan pencarian instan."
            />
            <FeatureCard 
                icon={<GitFork className="text-purple-500" />} 
                title="Fork & Remix" 
                desc="Fork snippet orang lain ke dashboardmu dan modifikasi."
            />
            <FeatureCard 
                icon={<Share2 className="text-green-500" />} 
                title="Bagikan Ide" 
                desc="Satu klik membagikan link snippet ke teman atau komunitas."
            />
            <Link to="/cli-docs">
              <FeatureCard 
                  icon={<Terminal className="text-pink-500" />} 
                  title="CLI Tool" 
                  desc="Kelola snippet langsung dari terminal. Install via NPM!"
              />
            </Link>
        </div>
      </section>

      {/* FOOTER SIMPLE */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-12 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Lumbung Kode by Sofyan Farros. All rights reserved.</p>
      </footer>
    </div>
  )
}

function CheckMark() {
    return (
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    )
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-pink-200 dark:hover:border-pink-500/30 transition shadow-sm hover:shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 bg-gray-50 dark:bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
        </div>
    )
}