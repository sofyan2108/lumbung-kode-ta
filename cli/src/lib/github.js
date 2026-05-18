/**
 * GitHub Fetch Utility for CLI
 * Uses Node.js native https module (no extra dependency needed).
 * 
 * Supported URL formats:
 *   - https://github.com/{owner}/{repo}/blob/{branch}/{path}
 *   - https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
 *   - https://gist.github.com/{user}/{gist_id}
 */

import https from 'https'

// Extension → Language mapping
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
}

/**
 * Detect language from filename extension
 */
function detectLanguageFromFilename(filename) {
  const dotIndex = filename.lastIndexOf('.')
  if (dotIndex === -1) return 'plaintext'
  const ext = filename.slice(dotIndex).toLowerCase()
  return EXTENSION_MAP[ext] || 'plaintext'
}

/**
 * Simple HTTPS GET request (follows redirects)
 */
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'LumbungKode-CLI/1.0',
        ...headers,
      },
    }

    https.get(url, options, (res) => {
      // Follow redirects (301, 302, 307, 308)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location, headers).then(resolve).catch(reject)
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        res.resume() // consume data to free memory
        return
      }

      let data = ''
      res.setEncoding('utf-8')
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve(data))
      res.on('error', reject)
    }).on('error', reject)
  })
}

/**
 * Parse GitHub URL into structured info
 */
export function parseGitHubUrl(url) {
  try {
    const parsed = new URL(url.trim())
    const hostname = parsed.hostname
    const pathname = parsed.pathname

    // Type 1: Raw URL
    if (hostname === 'raw.githubusercontent.com') {
      const parts = pathname.split('/').filter(Boolean)
      if (parts.length < 4) return null
      return {
        type: 'raw',
        rawUrl: url.trim(),
        filename: parts[parts.length - 1],
        repoInfo: `${parts[0]}/${parts[1]}`,
      }
    }

    // Type 2: Gist
    if (hostname === 'gist.github.com') {
      const parts = pathname.split('/').filter(Boolean)
      if (parts.length < 2) return null
      const gistId = parts[parts.length - 1]
      return {
        type: 'gist',
        rawUrl: `https://api.github.com/gists/${gistId}`,
        filename: '',
        repoInfo: `gist:${gistId}`,
      }
    }

    // Type 3: Standard GitHub file URL
    if (hostname === 'github.com' || hostname === 'www.github.com') {
      const parts = pathname.split('/').filter(Boolean)
      if (parts.length < 5 || parts[2] !== 'blob') return null
      const owner = parts[0]
      const repo = parts[1]
      const branch = parts[3]
      const filePath = parts.slice(4).join('/')
      return {
        type: 'file',
        rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`,
        filename: parts[parts.length - 1],
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
 * @returns {Promise<{ code: string, filename: string, language: string, sourceUrl: string, repoInfo: string }>}
 */
export async function fetchGitHubFile(url) {
  const parsed = parseGitHubUrl(url)
  if (!parsed) {
    throw new Error('URL tidak valid. Gunakan link file dari GitHub (github.com/.../blob/...) atau Gist.')
  }

  // Handle Gist
  if (parsed.type === 'gist') {
    const rawJson = await httpsGet(parsed.rawUrl, {
      'Accept': 'application/vnd.github.v3+json',
    })

    const data = JSON.parse(rawJson)
    const files = Object.values(data.files || {})
    if (files.length === 0) throw new Error('Gist tidak memiliki file.')

    const file = files[0]
    return {
      code: file.content,
      filename: file.filename,
      language: detectLanguageFromFilename(file.filename),
      sourceUrl: url.trim(),
      repoInfo: parsed.repoInfo,
    }
  }

  // Fetch raw file
  const code = await httpsGet(parsed.rawUrl)

  if (code.length > 100000) {
    throw new Error('File terlalu besar (>100KB). Coba file yang lebih kecil.')
  }

  return {
    code,
    filename: parsed.filename,
    language: detectLanguageFromFilename(parsed.filename),
    sourceUrl: url.trim(),
    repoInfo: parsed.repoInfo,
  }
}
