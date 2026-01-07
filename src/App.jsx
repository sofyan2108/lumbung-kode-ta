import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'
import { Loader2 } from 'lucide-react'
import GlobalAlert from './components/globalAlert'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'

// Lazy Load Pages
const Login = lazy(() => import('./pages/login'))
const Dashboard = lazy(() => import('./pages/dashboard'))
const Explore = lazy(() => import('./pages/explore'))
const DetailSnippet = lazy(() => import('./pages/detailSnippet'))
const UserProfile = lazy(() => import('./pages/userProfile'))
const NotFound = lazy(() => import('./pages/notFound'))
const LandingPage = lazy(() => import('./pages/landingPage'))
const CliDocs = lazy(() => import('./pages/cliDocs'))

function LoadingFallback() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-[#0F1218]">
      <Loader2 className="animate-spin text-pink-500" size={40} />
    </div>
  )
}

function App() {
  const { checkUser } = useAuthStore()
  const { initializeTheme } = useThemeStore()

  useEffect(() => {
    checkUser()
    initializeTheme()
  }, [])

  return (
    <BrowserRouter>
      {/* Global Alert dipasang di sini agar muncul di atas semua halaman */}
      <GlobalAlert />
      
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/snippet/:id" element={<DetailSnippet />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cli-docs" element={<CliDocs />} />
          
          {/* ROUTE 404 (WAJIB DI PALING BAWAH) */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App