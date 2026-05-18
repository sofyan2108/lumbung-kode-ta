/**
 * GitHub Fetch Utility
 * Parse GitHub URLs dan fetch konten file dari public repositories.
 * 
 * Supported URL formats:
 *   - https://github.com/{owner}/{repo}/blob/{branch}/{path}
 *   - https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
 *   - https://gist.github.com/{user}/{gist_id}
 */

// Extension → Language mapping (sama dengan CLI push.js)
const EXTENSION_MAP = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.java': 'java',
  '.cpp': 'cpp',
  '.c': 'c',
  '.cs': 'csharp',
  '.go': 'go',
  '.rs': 'rust',
  '.rb': 'ruby',
  '.php': 'php',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sql': 'sql',
  '.md': 'markdown',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.xml': 'xml',
  '.sh': 'bash',
  '.bat': 'batch',
  '.ps1': 'powershell',
  '.dart': 'dart',
  '.kt': 'kotlin',
  '.swift': 'swift',
  '.r': 'r',
  '.lua': 'lua',
  '.vue': 'javascript',
  '.svelte': 'javascript',
  '.toml': 'toml',
  '.dockerfile': 'docker',
  '.env': 'plaintext',
}

/**
 * Detect language from file extension
 */
function detectLanguageFromFilename(filename) {
  const dotIndex = filename.lastIndexOf('.')
  if (dotIndex === -1) return 'plaintext'
  const ext = filename.slice(dotIndex).toLowerCase()
  return EXTENSION_MAP[ext] || 'plaintext'
}

/**
 * Parse GitHub URL and determine the type
 * @returns {{ type: 'file' | 'raw' | 'gist', rawUrl: string, filename: string, repoInfo: string } | null}
 */
export function parseGitHubUrl(url) {
  try {
    const parsed = new URL(url.trim())
    const hostname = parsed.hostname
    const pathname = parsed.pathname

    // Type 1: Raw URL — already direct
    // https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
    if (hostname === 'raw.githubusercontent.com') {
      const parts = pathname.split('/').filter(Boolean) // [owner, repo, branch, ...path]
      if (parts.length < 4) return null

      const filename = parts[parts.length - 1]
      const owner = parts[0]
      const repo = parts[1]

      return {
        type: 'raw',
        rawUrl: url.trim(),
        filename,
        repoInfo: `${owner}/${repo}`,
      }
    }

    // Type 2: Gist URL
    // https://gist.github.com/{user}/{gist_id}
    if (hostname === 'gist.github.com') {
      const parts = pathname.split('/').filter(Boolean)
      if (parts.length < 2) return null

      const gistId = parts[parts.length - 1]

      return {
        type: 'gist',
        rawUrl: `https://api.github.com/gists/${gistId}`,
        filename: '', // Will be determined after fetch
        repoInfo: `gist:${gistId}`,
      }
    }

    // Type 3: Standard GitHub file URL
    // https://github.com/{owner}/{repo}/blob/{branch}/{path}
    if (hostname === 'github.com' || hostname === 'www.github.com') {
      const parts = pathname.split('/').filter(Boolean)
      // Minimum: [owner, repo, 'blob', branch, ...filepath]
      if (parts.length < 5 || parts[2] !== 'blob') return null

      const owner = parts[0]
      const repo = parts[1]
      const branch = parts[3]
      const filePath = parts.slice(4).join('/')
      const filename = parts[parts.length - 1]

      return {
        type: 'file',
        rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`,
        filename,
        repoInfo: `${owner}/${repo}`,
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Fetch file content from GitHub
 * @param {string} url - GitHub URL (any supported format)
 * @returns {Promise<{ code: string, filename: string, language: string, sourceUrl: string }>}
 */
export async function fetchGitHubFile(url) {
  const parsed = parseGitHubUrl(url)
  if (!parsed) {
    throw new Error('URL tidak valid. Gunakan link file dari GitHub (github.com/.../blob/...) atau Gist.')
  }

  // Handle Gist separately
  if (parsed.type === 'gist') {
    return fetchGist(parsed.rawUrl, url)
  }

  // Fetch raw file content
  const response = await fetch(parsed.rawUrl)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('File tidak ditemukan. Pastikan URL benar dan repository bersifat public.')
    }
    throw new Error(`Gagal mengambil file dari GitHub (HTTP ${response.status})`)
  }

  const code = await response.text()

  // Validate: not too large
  if (code.length > 100000) {
    throw new Error('File terlalu besar (>100KB). Coba file yang lebih kecil.')
  }

  const language = detectLanguageFromFilename(parsed.filename)

  return {
    code,
    filename: parsed.filename,
    language,
    sourceUrl: url.trim(),
    repoInfo: parsed.repoInfo,
  }
}

/**
 * Fetch Gist content
 */
async function fetchGist(apiUrl, originalUrl) {
  const response = await fetch(apiUrl, {
    headers: { 'Accept': 'application/vnd.github.v3+json' }
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Gist tidak ditemukan. Pastikan URL benar dan Gist bersifat public.')
    }
    throw new Error(`Gagal mengambil Gist (HTTP ${response.status})`)
  }

  const data = await response.json()
  const files = Object.values(data.files || {})

  if (files.length === 0) {
    throw new Error('Gist tidak memiliki file.')
  }

  // Ambil file pertama (atau yang paling besar)
  const file = files[0]
  const code = file.content
  const filename = file.filename
  const language = detectLanguageFromFilename(filename)

  return {
    code,
    filename,
    language,
    sourceUrl: originalUrl.trim(),
    repoInfo: `gist`,
  }
}

/**
 * Quick validation: is this a GitHub URL?
 */
export function isGitHubUrl(url) {
  if (!url) return false
  try {
    const parsed = new URL(url.trim())
    return ['github.com', 'www.github.com', 'raw.githubusercontent.com', 'gist.github.com'].includes(parsed.hostname)
  } catch {
    return false
  }
}
