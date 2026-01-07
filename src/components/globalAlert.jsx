import { CheckCircle2, AlertTriangle, X, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAlertStore } from '../store/alertStore'

export default function GlobalAlert() {
  const { isOpen, type, title, message, showLoginButton, closeAlert } = useAlertStore()
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleLogin = () => {
    closeAlert()
    navigate('/login')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      <div className="bg-white dark:bg-pastel-dark-surface w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-pastel-dark-border">
        
        <div className={`h-2 w-full ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              type === 'success' 
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {type === 'success' ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {title}
              </h3>
              <p className="text-gray-500 dark:text-gray-300 text-sm leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {showLoginButton && (
              <button 
                onClick={handleLogin}
                className="flex-[2] px-6 py-2.5 rounded-xl font-bold text-white transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-lg bg-pink-500 hover:bg-pink-600 shadow-pink-500/30 flex items-center justify-center gap-2"
              >
                <LogIn size={18} />
                Login Sekarang
              </button>
            )}
            <button 
              onClick={closeAlert}
              className={`px-6 py-2.5 rounded-xl font-bold text-white transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-lg ${
                 type === 'success' 
                 ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30' 
                 : showLoginButton 
                   ? 'flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 shadow-none'
                   : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
              }`}
            >
              {showLoginButton ? 'Tutup' : 'Oke, Mengerti'}
            </button>
          </div>
        </div>

        <button 
          onClick={closeAlert}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition hover:rotate-90 duration-200"
        >
          <X size={20} />
        </button>

      </div>
    </div>
  )
}