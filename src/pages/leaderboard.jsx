import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppLayout from '../components/appLayout'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Trophy, Medal, Star, Code, GitFork, Crown, Loader2, ArrowUpRight, ArrowLeft, Filter, Copy } from 'lucide-react'

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('score')
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      try {
        const { data, error } = await supabase.rpc('get_leaderboard', { lim: 50, sort_by: sortBy })
        if (error) {
          console.error('Fetch leaderboard error details:', JSON.stringify(error, null, 2))
          throw error
        }
        setLeaderboard(data || [])
      } catch (error) {
        console.error('Fetch leaderboard error:', error.message || error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [sortBy])

  const getRankStyle = (index) => {
    switch (index) {
      case 0: return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/50 shadow-sm'
      case 1: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 shadow-sm'
      case 2: return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700/50 shadow-sm'
      default: return 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-gray-800'
    }
  }

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Crown size={20} className="text-yellow-600 dark:text-yellow-400" />
      case 1: return <Medal size={20} className="text-gray-600 dark:text-gray-400" />
      case 2: return <Medal size={20} className="text-orange-600 dark:text-orange-400" />
      default: return <span className="font-bold text-sm">#{index + 1}</span>
    }
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto pb-20">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400 transition group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
          Kembali
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
            <Trophy size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight mb-4">
            Leaderboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl text-lg">
            Peringkat developer terbaik berdasarkan kontribusi snippet publik, jumlah likes, dan fork.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white dark:bg-[#1a1f2b] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl">
              <Code size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Snippet</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">+1 Point</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1f2b] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl">
              <Star size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Like</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">+1 Point</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1f2b] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-xl">
              <Copy size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Copy</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">+1 Point</p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter size={20} className="text-indigo-500" /> Filter Peringkat
          </h2>
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#1a1f2b] p-1.5 rounded-xl border border-gray-200 dark:border-gray-800">
            {[
              { id: 'score', label: 'Total Score' },
              { id: 'snippets', label: 'Banyak Kontribusi' },
              { id: 'likes', label: 'Paling Disukai' },
              { id: 'copies', label: 'Paling Banyak di-Copy' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setSortBy(filter.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  sortBy === filter.id 
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white dark:bg-pastel-dark-surface rounded-3xl shadow-xl border border-gray-100 dark:border-pastel-dark-border overflow-hidden relative">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Memuat peringkat...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-20">
              <Trophy size={60} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Belum Ada Data</h3>
              <p className="text-gray-500 dark:text-gray-400">Jadilah yang pertama membagikan snippet publik!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-bold">
                    <th className="px-6 py-4 rounded-tl-3xl">Rank</th>
                    <th className="px-6 py-4">Developer</th>
                    <th className="px-6 py-4 text-center">Snippets</th>
                    <th className="px-6 py-4 text-center">Likes</th>
                    <th className="px-6 py-4 text-center">Copies</th>
                    <th className="px-6 py-4 text-right rounded-tr-3xl">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {leaderboard.map((u, index) => {
                    const isCurrentUser = user?.id === u.user_id
                    
                    return (
                      <tr 
                        key={u.user_id} 
                        className={`group transition-colors ${
                          isCurrentUser 
                            ? 'bg-indigo-50/50 dark:bg-indigo-900/10' 
                            : 'hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        {/* Rank */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border ${getRankStyle(index)}`}>
                            {getRankIcon(index)}
                          </div>
                        </td>
                        
                        {/* User */}
                        <td className="px-6 py-4">
                          <Link to={`/user/${u.user_id}`} className="flex items-center gap-3 w-fit group/link">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform group-hover/link:scale-110 ${
                              isCurrentUser ? 'bg-indigo-500' : 'bg-gray-400 dark:bg-gray-600'
                            }`}>
                              {u.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className={`font-bold text-sm md:text-base flex items-center gap-2 transition-colors ${
                                isCurrentUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white group-hover/link:text-indigo-500'
                              }`}>
                                {u.full_name || 'Anonymous Developer'}
                                {isCurrentUser && <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded-full">You</span>}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 opacity-0 group-hover/link:opacity-100 transition-opacity">
                                View Profile <ArrowUpRight size={12} />
                              </p>
                            </div>
                          </Link>
                        </td>
                        
                        {/* Stats */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg text-sm font-semibold">
                            <Code size={14} /> {u.total_snippets}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-semibold">
                            <Star size={14} /> {u.total_likes}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-sm font-semibold">
                            <Copy size={14} /> {u.total_copies}
                          </span>
                        </td>
                        
                        {/* Score */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <span className="text-lg font-black text-gray-800 dark:text-gray-200">
                            {u.total_score.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
