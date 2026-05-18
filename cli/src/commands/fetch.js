/**
 * Fetch Command - Import snippet from GitHub URL
 * 
 * Supports:
 *   - GitHub file URLs:  https://github.com/{owner}/{repo}/blob/{branch}/{path}
 *   - Raw URLs:          https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
 *   - Gist URLs:         https://gist.github.com/{user}/{gist_id}
 */

import fs from 'fs'
import chalk from 'chalk'
import ora from 'ora'
import { fetchGitHubFile, parseGitHubUrl } from '../lib/github.js'
import { createSnippet } from '../lib/api.js'
import { isLoggedIn } from '../lib/config.js'
import { validateCodeWithAI } from '../lib/gemini.js'

export async function fetchFromGitHub(url, options) {
  // --- Validasi URL awal ---
  const parsed = parseGitHubUrl(url)
  if (!parsed) {
    console.log(chalk.red('✗ URL tidak valid.'))
    console.log('')
    console.log(chalk.gray('Format URL yang didukung:'))
    console.log(chalk.gray('  • https://github.com/{user}/{repo}/blob/{branch}/{path}'))
    console.log(chalk.gray('  • https://raw.githubusercontent.com/{user}/{repo}/{branch}/{path}'))
    console.log(chalk.gray('  • https://gist.github.com/{user}/{gist_id}'))
    return
  }

  const spinner = ora('Mengambil file dari GitHub...').start()

  try {
    // 1. Fetch konten dari GitHub
    const result = await fetchGitHubFile(url)
    
    spinner.succeed(chalk.green(`✓ File diambil: ${chalk.bold(result.filename)} dari ${chalk.cyan(result.repoInfo)}`))

    // 2. Jika --output, simpan ke file lokal saja
    if (options.output) {
      fs.writeFileSync(options.output, result.code)
      console.log('')
      console.log(chalk.green(`✓ Disimpan ke: ${chalk.bold(options.output)}`))
      console.log(chalk.gray(`  Bahasa terdeteksi: ${result.language}`))
      console.log(chalk.gray(`  Ukuran: ${result.code.length} karakter`))
      return
    }

    // 3. Cek login untuk simpan ke Lumbung Kode
    if (!isLoggedIn()) {
      console.log('')
      console.log(chalk.yellow('⚠ Belum login — file hanya ditampilkan, tidak disimpan ke Lumbung Kode.'))
      console.log(chalk.yellow('  Jalankan: lumbung login, lalu coba lagi.'))
      console.log('')
      console.log(chalk.gray('─'.repeat(55)))
      console.log(result.code)
      console.log(chalk.gray('─'.repeat(55)))
      return
    }

    // 4. Siapkan metadata snippet
    const title = options.title || result.filename.replace(/\.[^/.]+$/, '') // Hapus ekstensi
    const language = options.language || result.language
    const description = options.description || `Diimpor dari GitHub: ${result.sourceUrl}`
    const tags = options.tags ? options.tags.split(',').map(t => t.trim()) : []
    const isPublic = options.public || false

    // 5. AI Quality Gate
    spinner.start('Memvalidasi konten dengan AI Quality Gate...')

    let aiTitle = title
    let aiLanguage = language

    try {
      const validation = await validateCodeWithAI(result.code)

      if (validation.skipped) {
        spinner.warn(chalk.yellow('⚠ AI Quality Gate dilewati (GEMINI_API_KEY tidak ditemukan).'))
      } else if (!validation.isValid || validation.confidenceScore < 0.7) {
        spinner.fail(chalk.red('✗ AI Quality Gate: Konten ditolak!'))
        console.log('')
        console.log(chalk.red('─'.repeat(55)))
        console.log(chalk.red.bold('  🚫 Konten Tidak Valid untuk Lumbung Kode'))
        console.log(chalk.red('─'.repeat(55)))
        console.log(chalk.red(`  Alasan     : ${validation.reason || 'Konten tidak terdeteksi sebagai kode program.'}`))
        console.log(chalk.red(`  Confidence : ${(validation.confidenceScore * 100).toFixed(0)}% (minimum 70%)`))
        console.log(chalk.red('─'.repeat(55)))
        console.log('')
        return
      } else {
        spinner.succeed(chalk.green(`✓ AI Quality Gate: Valid (${(validation.confidenceScore * 100).toFixed(0)}% confidence)`))

        if (!options.title && validation.metadata.title) {
          aiTitle = validation.metadata.title
        }
        if (!options.language && validation.metadata.language) {
          aiLanguage = validation.metadata.language
        }
      }
    } catch (aiError) {
      spinner.warn(chalk.yellow(`⚠ AI Quality Gate gagal (${aiError.message}). Upload dilanjutkan tanpa validasi.`))
    }

    // 6. Upload ke Lumbung Kode
    spinner.start('Mengunggah snippet ke Lumbung Kode...')

    const snippet = await createSnippet({
      title: aiTitle,
      language: aiLanguage,
      code: result.code,
      description,
      tags,
      is_public: isPublic,
      documentation_url: result.sourceUrl,
    })

    spinner.succeed(chalk.green('Snippet berhasil disimpan!'))

    // 7. Tampilkan hasil
    console.log('')
    console.log(chalk.gray('─'.repeat(55)))
    console.log(chalk.bold('📝 Snippet Details:'))
    console.log(chalk.gray('─'.repeat(55)))
    console.log(`   ${chalk.cyan('ID:')}       ${snippet.id}`)
    console.log(`   ${chalk.cyan('Title:')}    ${snippet.title}${aiTitle !== title ? chalk.gray(' (dari AI)') : ''}`)
    console.log(`   ${chalk.cyan('Language:')} ${snippet.language}${aiLanguage !== language ? chalk.gray(' (dari AI)') : ''}`)
    console.log(`   ${chalk.cyan('Source:')}   ${chalk.underline(result.sourceUrl)}`)
    console.log(`   ${chalk.cyan('Public:')}   ${snippet.is_public ? '🌍 Yes' : '🔒 No'}`)
    if (tags.length > 0) {
      console.log(`   ${chalk.cyan('Tags:')}     ${tags.map(t => `#${t}`).join(' ')}`)
    }
    console.log(chalk.gray('─'.repeat(55)))
    console.log('')
    console.log(chalk.gray(`View at: https://lumbungkode.netlify.app/snippet/${snippet.id}`))

  } catch (error) {
    spinner.fail(chalk.red('Gagal mengambil file dari GitHub'))
    console.log(chalk.red(`Error: ${error.message}`))
  }
}
