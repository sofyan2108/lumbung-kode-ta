/**
 * Push Command - Upload snippet from file
 */

import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import { createSnippet } from '../lib/api.js'
import { isLoggedIn } from '../lib/config.js'
import { validateCodeWithAI } from '../lib/gemini.js'

// Extension to language mapping
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
  '.ps1': 'powershell'
}

export async function push(file, options) {
  // Check login
  if (!isLoggedIn()) {
    console.log(chalk.red('✗ Not logged in. Run: lumbung login'))
    return
  }
  
  // Check file exists
  if (!fs.existsSync(file)) {
    console.log(chalk.red(`✗ File not found: ${file}`))
    return
  }
  
  const spinner = ora('Reading file...').start()
  
  try {
    // Read file content
    const code = fs.readFileSync(file, 'utf-8')
    
    if (!code.trim()) {
      spinner.fail(chalk.red('File is empty'))
      return
    }
    
    // Detect language from extension
    const ext = path.extname(file).toLowerCase()
    const detectedLanguage = EXTENSION_MAP[ext] || 'plaintext'
    
    // Use provided options or defaults
    const title = options.title || path.basename(file, ext)
    const language = options.language || detectedLanguage
    const description = options.description || ''
    const tags = options.tags ? options.tags.split(',').map(t => t.trim()) : []
    const isPublic = options.public || false
    
    // Enhanced metadata
    const dependencies = options.dependencies ? JSON.parse(options.dependencies) : []
    const usageExample = options.usageExample || options.usage || ''
    const documentationUrl = options.documentationUrl || options.docs || ''
    
    // ── AI QUALITY GATE ─────────────────────────────────────────────────────
    spinner.text = 'Memvalidasi konten dengan AI Quality Gate...'

    let aiTitle = title
    let aiLanguage = language

    try {
      const validation = await validateCodeWithAI(code)

      if (validation.skipped) {
        // Tidak ada Gemini API Key — lewati validasi, tampilkan peringatan
        spinner.warn(
          chalk.yellow('⚠ AI Quality Gate dilewati (GEMINI_API_KEY tidak ditemukan).')
        )
      } else if (!validation.isValid || validation.confidenceScore < 0.7) {
        // Konten DITOLAK oleh AI
        spinner.fail(chalk.red('✗ AI Quality Gate: Konten ditolak!'))
        console.log('')
        console.log(chalk.red('─'.repeat(55)))
        console.log(chalk.red.bold('  🚫 Konten Tidak Valid untuk Lumbung Kode'))
        console.log(chalk.red('─'.repeat(55)))
        console.log(chalk.red(`  Alasan     : ${validation.reason || 'Konten tidak terdeteksi sebagai kode program.'}`))        
        console.log(chalk.red(`  Confidence : ${(validation.confidenceScore * 100).toFixed(0)}% (minimum 70%)`))        
        console.log(chalk.red('─'.repeat(55)))
        console.log('')
        console.log(chalk.gray('  Pastikan file yang diupload berisi kode program,'))
        console.log(chalk.gray('  file konfigurasi (JSON/YAML/Dockerfile), atau'))
        console.log(chalk.gray('  dokumentasi teknis (Markdown dengan blok kode).'))
        console.log('')
        return // Batalkan upload
      } else {
        // Konten VALID — gunakan metadata AI jika lebih baik
        spinner.succeed(chalk.green(`✓ AI Quality Gate: Valid (${(validation.confidenceScore * 100).toFixed(0)}% confidence)`))

        // Prioritaskan metadata dari AI jika user tidak memberi flag --title / --language
        if (!options.title && validation.metadata.title) {
          aiTitle = validation.metadata.title
        }
        if (!options.language && validation.metadata.language) {
          aiLanguage = validation.metadata.language
        }
      }
    } catch (aiError) {
      // Jika Gemini tidak bisa dihubungi, tampilkan peringatan tapi tetap lanjutkan
      spinner.warn(chalk.yellow(`⚠ AI Quality Gate gagal (${aiError.message}). Upload dilanjutkan tanpa validasi.`))
    }
    // ── END AI QUALITY GATE ──────────────────────────────────────────────────

    spinner.text = 'Mengunggah snippet...'

    // Gunakan aiTitle / aiLanguage (bisa berasal dari AI atau dari flag user)
    const finalTitle = aiTitle
    const finalLanguage = aiLanguage

    // Create snippet
    const snippet = await createSnippet({
      title: finalTitle,
      language: finalLanguage,
      code,
      description,
      tags,
      is_public: isPublic,
      dependencies,
      usage_example: usageExample,
      documentation_url: documentationUrl
    })
    
    spinner.succeed(chalk.green('Snippet uploaded successfully!'))
    
    // Display result
    console.log('')
    console.log(chalk.gray('─'.repeat(50)))
    console.log(chalk.bold('📝 Snippet Details:'))
    console.log(chalk.gray('─'.repeat(50)))
    console.log(`   ${chalk.cyan('ID:')}       ${snippet.id}`)
    console.log(`   ${chalk.cyan('Title:')}    ${snippet.title}${aiTitle !== title ? chalk.gray(' (dari AI)') : ''}`)
    console.log(`   ${chalk.cyan('Language:')} ${snippet.language}${aiLanguage !== language ? chalk.gray(' (dari AI)') : ''}`)
    console.log(`   ${chalk.cyan('Public:')}   ${snippet.is_public ? '🌍 Yes' : '🔒 No'}`)
    if (tags.length > 0) {
      console.log(`   ${chalk.cyan('Tags:')}     ${tags.map(t => `#${t}`).join(' ')}`)
    }
    console.log(chalk.gray('─'.repeat(50)))
    console.log('')
    console.log(chalk.gray(`View at: https://lumbungkode.netlify.app/snippet/${snippet.id}`))
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to upload snippet'))
    console.log(chalk.red(`Error: ${error.message}`))
  }
}

