import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Terminal, Package, Zap, BookOpen, Lightbulb, 
  Target, Bug, Copy, Check,
  Download, Search, Upload, LogIn, LogOut, User,
  ExternalLink
} from 'lucide-react'
import AppLayout from '../components/appLayout'

// Tab data
const tabs = [
  { id: 'install', label: 'Instalasi', icon: Package },
  { id: 'quickstart', label: 'Quick Start', icon: Zap },
  { id: 'commands', label: 'Semua Command', icon: Terminal },
  { id: 'examples', label: 'Contoh', icon: BookOpen },
  { id: 'tips', label: 'Tips & Tricks', icon: Lightbulb },
  { id: 'troubleshoot', label: 'Troubleshooting', icon: Bug },
]

// Copyable code block component
function CodeBlock({ code, language = 'bash', copyable = true }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group overflow-hidden">
      <pre className="bg-gray-900 dark:bg-black/50 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm font-mono border border-gray-800 whitespace-pre-wrap break-all">
        <code>{code}</code>
      </pre>
      {copyable && (
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy to clipboard"
        >
          {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />}
        </button>
      )}
    </div>
  )
}

function CommandCard({ icon: Icon, title, description, command, options }) {
  return (
    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-6 space-y-4 overflow-hidden">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="text-pink-500" size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white break-words">{title}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 break-words">{description}</p>
        </div>
      </div>
      
      <CodeBlock code={command} />
      
      {options && options.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Option</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Alias</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              {options.map((opt, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 px-2 sm:px-3 font-mono text-pink-600 dark:text-pink-400 text-xs sm:text-sm break-all">{opt.option}</td>
                  <td className="py-2 px-2 sm:px-3 font-mono text-gray-500 text-xs sm:text-sm">{opt.alias || '-'}</td>
                  <td className="py-2 px-2 sm:px-3 text-gray-600 dark:text-gray-400 text-xs sm:text-sm">{opt.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Installation section
function InstallSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <Package className="text-pink-500" />
          Instalasi CLI
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Pilih salah satu metode instalasi berikut sesuai kebutuhan Anda.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200 dark:border-pink-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-pink-500 text-white text-xs font-bold rounded-full">RECOMMENDED</span>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Opsi 1: Install dari NPM</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Cara paling mudah dan cepat.</p>
          <CodeBlock code="npm install -g lumbung-cli" />
        </div>

        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Opsi 2: Install dari Source</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Untuk developer yang ingin contribute.</p>
          <CodeBlock code={`git clone https://github.com/sofyan2108/lumbung-kode-ta.git
cd lumbung-kode-ta/cli
npm install
npm link`} />
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
          <Check size={20} />
          Cek Instalasi
        </h4>
        <p className="text-blue-700 dark:text-blue-400 text-sm mb-3">Jalankan command berikut untuk memastikan CLI terinstall:</p>
        <CodeBlock code="lumbung --version" />
      </div>
    </div>
  )
}

// Quick Start section
function QuickStartSection() {
  const steps = [
    { num: 1, title: 'Login ke Akun', desc: 'Gunakan email & password yang sama dengan web app.', code: 'lumbung login' },
    { num: 2, title: 'Upload Snippet Pertama', desc: 'Upload file apapun sebagai snippet.', code: 'lumbung push myfile.js --public' },
    { num: 3, title: 'Lihat Semua Snippet', desc: 'Tampilkan daftar snippet milikmu.', code: 'lumbung list' },
    { num: 4, title: 'Download Snippet', desc: 'Ambil snippet berdasarkan ID.', code: 'lumbung get <snippet-id> --output downloaded.js' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <Zap className="text-yellow-500" />
          Quick Start
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Mulai menggunakan Lumbung CLI dalam 4 langkah mudah.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step) => (
          <div key={step.num} className="flex gap-4">
            <div className="w-10 h-10 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
              {step.num}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{step.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{step.desc}</p>
              </div>
              <CodeBlock code={step.code} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">🎉</span>
        <p className="text-green-700 dark:text-green-400 font-medium">Selesai! Kamu sudah siap menggunakan Lumbung CLI.</p>
      </div>
    </div>
  )
}

// Commands section
function CommandsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <Terminal className="text-purple-500" />
          Semua Command
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Referensi lengkap semua command yang tersedia di Lumbung CLI.
        </p>
      </div>

      {/* Authentication */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
          🔐 Authentication
        </h3>
        <div className="grid gap-4">
          <CommandCard
            icon={LogIn}
            title="lumbung login"
            description="Login ke akun Lumbung Kode dengan email & password."
            command="lumbung login"
          />
          <CommandCard
            icon={LogOut}
            title="lumbung logout"
            description="Keluar dari akun."
            command="lumbung logout"
          />
          <CommandCard
            icon={User}
            title="lumbung whoami"
            description="Cek status login saat ini."
            command="lumbung whoami"
          />
        </div>
      </div>

      {/* Upload */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
          📤 Upload Snippet
        </h3>
        <CommandCard
          icon={Upload}
          title="lumbung push <file>"
          description="Upload file sebagai snippet dengan metadata lengkap."
          command={`lumbung push component.jsx \\
  --title "React Hook: useAuth" \\
  --description "Custom authentication hook" \\
  --tags "react,hooks,auth" \\
  --public \\
  --dependencies '["react","zustand"]' \\
  --usage "const { user } = useAuth()" \\
  --docs "https://docs.example.com"`}
          options={[
            { option: '--title <text>', alias: '-t', desc: 'Judul snippet' },
            { option: '--description <text>', alias: '-d', desc: 'Deskripsi snippet' },
            { option: '--language <lang>', alias: '-l', desc: 'Bahasa pemrograman' },
            { option: '--tags <tags>', alias: '', desc: 'Tags (pisah koma)' },
            { option: '--public', alias: '', desc: 'Buat public' },
            { option: '--dependencies <json>', alias: '', desc: 'Dependencies (JSON array)' },
            { option: '--usage <example>', alias: '', desc: 'Contoh penggunaan' },
            { option: '--docs <url>', alias: '', desc: 'URL dokumentasi' },
          ]}
        />
      </div>

      {/* Download */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
          📥 Download Snippet
        </h3>
        <CommandCard
          icon={Download}
          title="lumbung get <id>"
          description="Ambil snippet berdasarkan ID."
          command="lumbung get 8ad61948-xxxx --output myfile.jsx"
          options={[
            { option: '--output <file>', alias: '-o', desc: 'Simpan ke file' },
            { option: '--copy', alias: '-c', desc: 'Copy ke clipboard' },
          ]}
        />
      </div>

      {/* List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
          📋 List Snippets
        </h3>
        <CommandCard
          icon={Terminal}
          title="lumbung list"
          description="Tampilkan daftar snippet Anda."
          command="lumbung list --language javascript --limit 20"
          options={[
            { option: '--language <lang>', alias: '-l', desc: 'Filter by bahasa' },
            { option: '--limit <number>', alias: '-n', desc: 'Max results (default: 10)' },
            { option: '--public', alias: '', desc: 'Hanya public snippets' },
            { option: '--json', alias: '', desc: 'Output format JSON' },
          ]}
        />
      </div>

      {/* Search */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
          🔍 Search Snippets
        </h3>
        <CommandCard
          icon={Search}
          title="lumbung search <query>"
          description="Cari snippet dengan full-text search."
          command='lumbung search "react hooks" --public --limit 5'
          options={[
            { option: '--language <lang>', alias: '-l', desc: 'Filter by bahasa' },
            { option: '--limit <number>', alias: '-n', desc: 'Max results (default: 10)' },
            { option: '--mine', alias: '', desc: 'Hanya snippet saya' },
            { option: '--public', alias: '', desc: 'Hanya public snippets' },
          ]}
        />
      </div>
    </div>
  )
}

// Examples section
function ExamplesSection() {
  const scenarios = [
    {
      title: 'Upload Project File',
      desc: 'Upload component dengan metadata lengkap',
      code: `# Navigasi ke folder project
cd D:/Projects/MyApp

# Upload dengan metadata lengkap
lumbung push src/components/Header.jsx \\
  --title "Responsive Header Component" \\
  --description "Header dengan dark mode support" \\
  --tags "react,component,responsive,darkmode" \\
  --dependencies '["react","lucide-react"]' \\
  --public`
    },
    {
      title: 'Cari & Download Snippet',
      desc: 'Cari snippet authentication dan download',
      code: `# Cari snippet authentication
lumbung search "authentication" --public

# Download snippet yang ditemukan
lumbung get abc123...xyz --output auth-helper.js`
    },
    {
      title: 'Backup Semua Snippet',
      desc: 'Export semua snippet ke JSON',
      code: `# List semua snippet dalam JSON
lumbung list --json > my-snippets.json`
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <BookOpen className="text-blue-500" />
          Contoh Penggunaan
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Skenario real-world untuk memaksimalkan CLI.
        </p>
      </div>

      <div className="space-y-6">
        {scenarios.map((scenario, i) => (
          <div key={i} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded">
                Skenario {i + 1}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{scenario.title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{scenario.desc}</p>
            <CodeBlock code={scenario.code} />
          </div>
        ))}
      </div>
    </div>
  )
}

// Tips section
function TipsSection() {
  const tips = [
    {
      title: 'Absolute vs Relative Path',
      code: `# Relative path (dari current directory)
lumbung push ./src/utils.js

# Absolute path (dari mana saja)
lumbung push D:/Projects/app/helper.js`
    },
    {
      title: 'Escape JSON String di Windows PowerShell',
      code: `# Gunakan single quotes
lumbung push file.js --dependencies '["react","zustand"]'`
    },
    {
      title: 'Alias/Shortcut',
      desc: 'Tambahkan ke .bashrc atau .zshrc:',
      code: `alias lp='lumbung push'
alias ll='lumbung list'
alias lg='lumbung get'`
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <Lightbulb className="text-yellow-500" />
          Tips & Tricks
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Pro tips untuk workflow lebih efisien.
        </p>
      </div>

      <div className="space-y-6">
        {tips.map((tip, i) => (
          <div key={i} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/50 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Target className="text-yellow-600" size={18} />
              {tip.title}
            </h3>
            {tip.desc && <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{tip.desc}</p>}
            <CodeBlock code={tip.code} />
          </div>
        ))}
      </div>
    </div>
  )
}

// Troubleshooting section
function TroubleshootSection() {
  const issues = [
    {
      error: 'Error: "Not logged in"',
      solution: 'lumbung login',
      desc: 'Login terlebih dahulu.'
    },
    {
      error: 'Error: "Invalid API key"',
      solution: `lumbung logout
lumbung login`,
      desc: 'Credentials expired. Login ulang.'
    },
    {
      error: 'Error: "File not found"',
      solution: `# Cek file exists
ls myfile.js

# Gunakan absolute path
lumbung push D:/full/path/to/file.js`,
      desc: 'Pastikan path ke file benar.'
    },
    {
      error: 'JSON Parse Error (--dependencies)',
      solution: `# ❌ Salah
--dependencies ["react"]

# ✅ Benar
--dependencies '["react","zustand"]'`,
      desc: 'Pastikan JSON valid dengan quotes.'
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <Bug className="text-red-500" />
          Troubleshooting
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Solusi untuk masalah umum yang mungkin kamu temui.
        </p>
      </div>

      <div className="space-y-6">
        {issues.map((issue, i) => (
          <div key={i} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-2xl p-6">
            <h3 className="font-mono text-red-600 dark:text-red-400 mb-2">{issue.error}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{issue.desc}</p>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
              <p className="text-green-700 dark:text-green-400 text-xs font-bold mb-2">✅ Solusi:</p>
              <CodeBlock code={issue.solution} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">🆘 Butuh Bantuan Lebih?</h4>
        <CodeBlock code={`# Help untuk semua command
lumbung --help

# Help untuk command tertentu
lumbung push --help
lumbung get --help`} />
      </div>
    </div>
  )
}

// Main component
export default function CliDocs() {
  const [activeTab, setActiveTab] = useState('install')
  const navigate = useNavigate()

  // Handler for collection click: navigate to Dashboard
  const handleSelectCollection = (collectionId) => {
    navigate('/dashboard', { state: { selectedCollection: collectionId } })
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'install': return <InstallSection />
      case 'quickstart': return <QuickStartSection />
      case 'commands': return <CommandsSection />
      case 'examples': return <ExamplesSection />
      case 'tips': return <TipsSection />
      case 'troubleshoot': return <TroubleshootSection />
      default: return <InstallSection />
    }
  }

  return (
    <AppLayout onSelectCollection={handleSelectCollection}>
      {/* Hero */}
      <div className="bg-gradient-to-br from-pink-500 to-purple-600 text-white py-10 px-6 rounded-2xl mb-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-full mb-4">
            <Terminal size={24} />
          </div>
          <h1 className="text-3xl font-bold mb-3">Pusat Bantuan CLI</h1>
          <p className="text-pink-100 mb-6">
            Dokumentasi lengkap untuk Lumbung CLI. Upload, download, dan kelola snippet langsung dari terminal.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 font-mono text-sm flex items-center gap-3">
              <code>npm install -g lumbung-cli</code>
              <button 
                onClick={() => navigator.clipboard.writeText('npm install -g lumbung-cli')}
                className="p-1.5 hover:bg-white/20 rounded transition"
              >
                <Copy size={16} />
              </button>
            </div>
            <a 
              href="https://npmjs.com/package/lumbung-cli" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition"
            >
              <Package size={16} />
              v1.0.4
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-[65px] z-10 bg-pastel-bg dark:bg-pastel-dark-bg -mx-4 md:-mx-8 px-4 md:px-8 py-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto mb-6">
        <nav className="flex gap-1 justify-center">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-pink-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {renderContent()}
      </div>

      {/* Footer Links */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <a href="https://github.com/sofyan2108/lumbung-kode-ta" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 flex items-center gap-1">
            GitHub <ExternalLink size={14} />
          </a>
          <a href="https://npmjs.com/package/lumbung-cli" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 flex items-center gap-1">
            NPM Package <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </AppLayout>
  )
}

