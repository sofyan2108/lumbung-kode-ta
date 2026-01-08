import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Mail, Lock, User, Loader2, ArrowRight, Sun, Moon, Code, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { loginWithEmail, registerWithEmail, user } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  })

  // REDIRECT KE /dashboard
  useEffect(() => {
    if (user) navigate('/dashboard') 
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isRegister) {
        await registerWithEmail(formData.email, formData.password, formData.fullName)
        alert('Registrasi berhasil! Akun Anda sudah aktif.')
      } else {
        await loginWithEmail(formData.email, formData.password)
      }
    } catch (error) {
      alert('Gagal: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen font-sans transition-colors duration-300 bg-white dark:bg-pastel-dark-bg">
      
      {/* KIRI: Dekorasi */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-pastel-bg dark:bg-[#0F1218] transition-colors duration-300 items-center justify-center p-12">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-300/30 dark:bg-pink-900/20 rounded-full blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-300/30 dark:bg-purple-900/20 rounded-full blur-3xl opacity-60 animate-pulse delay-1000"></div>
        
        <div className="relative z-10 text-center space-y-6 max-w-lg">
           <div className="w-20 h-20 bg-white dark:bg-white/10 backdrop-blur-md rounded-3xl shadow-xl flex items-center justify-center text-pink-500 mx-auto transform rotate-3 hover:rotate-6 transition duration-500">
              <Code size={40} strokeWidth={2.5} />
           </div>
           <h2 className="text-4xl font-bold text-gray-800 dark:text-white leading-tight">
             Simpan dan .<br/>
             <span className="text-pink-500">Bagikan Kodinganmu.</span>
           </h2>
           <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
             Platform manajemen snippet modern untuk developer yang mengutamakan keindahan dan efisiensi.
           </p>
           
           {/* Mockup */}
           <div className="mt-8 p-4 bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-xl border border-white/50 dark:border-white/10 text-left shadow-lg transform hover:-translate-y-2 transition duration-500">
              <div className="flex gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="space-y-2 font-mono text-xs text-gray-600 dark:text-gray-300">
                <p><span className="text-purple-500">const</span> <span className="text-blue-500">welcome</span> = () <span className="text-purple-500">=&gt;</span> {'{'}</p>
                <p className="pl-4"><span className="text-blue-500">return</span> <span className="text-green-500">"Hello, Lumbung Kode!"</span>;</p>
                <p>{'}'}</p>
              </div>
           </div>
        </div>
      </div>

      {/* KANAN: Form Login */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-12 lg:p-24 bg-white dark:bg-pastel-dark-surface transition-colors duration-300 relative">
        
        <button 
            onClick={toggleTheme}
            className="absolute top-6 right-6 p-3 rounded-full bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition"
        >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="lg:hidden w-12 h-12 bg-pink-50 dark:bg-pink-900/20 rounded-xl flex items-center justify-center text-pink-500 mb-4">
            <Code size={24} />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {isRegister ? 'Buat Akun Baru' : 'Selamat Datang'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {isRegister ? 'Gabung komunitas developer sekarang.' : 'Masuk untuk melanjutkan projekmu.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-pink-500 transition" size={20} />
                  <input 
                    type="text" 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 dark:text-white transition-all placeholder-gray-400"
                    placeholder="John Doe"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-pink-500 transition" size={20} />
                <input 
                  type="email" 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 dark:text-white transition-all placeholder-gray-400"
                  placeholder="name@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-pink-500 transition" size={20} />
                <input 
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 dark:bg-[#252a33] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 dark:text-white transition-all placeholder-gray-400"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition focus:outline-none"
                    title={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 transition-all flex items-center justify-center gap-2 transform active:scale-95"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {isRegister ? 'Buat Akun' : 'Masuk Sekarang'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="ml-2 font-bold text-pink-500 hover:text-pink-600 hover:underline focus:outline-none"
            >
              {isRegister ? 'Login disini' : 'Daftar sekarang'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}