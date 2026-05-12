/**
 * Config Command - Manage CLI configuration
 *
 * Usage:
 *   lumbung config set-ai-key <key>   Simpan Gemini API Key ke config lokal
 *   lumbung config remove-ai-key      Hapus Gemini API Key dari config
 *   lumbung config show               Tampilkan status config saat ini
 */

import chalk from 'chalk'
import { getConfig, saveGeminiApiKey, getGeminiApiKey } from '../lib/config.js'

// --------------------------------------------------------------------------
// Simpan Gemini API Key
// --------------------------------------------------------------------------
export function setAiKey(key) {
  if (!key || !key.trim()) {
    console.log(chalk.red('✗ API Key tidak boleh kosong.'))
    console.log(chalk.gray('  Contoh: lumbung config set-ai-key AIzaSy...'))
    return
  }

  if (!key.startsWith('AIza')) {
    console.log(chalk.yellow('⚠ Peringatan: API Key biasanya dimulai dengan "AIza". Pastikan key yang dimasukkan benar.'))
  }

  saveGeminiApiKey(key.trim())

  console.log('')
  console.log(chalk.green('✓ Gemini API Key berhasil disimpan!'))
  console.log(chalk.gray('  AI Quality Gate akan aktif otomatis saat lumbung push.'))
  console.log(chalk.gray(`  Key: ${key.trim().slice(0, 8)}${'*'.repeat(20)}`))
  console.log('')
}

// --------------------------------------------------------------------------
// Hapus Gemini API Key
// --------------------------------------------------------------------------
export function removeAiKey() {
  saveGeminiApiKey('')
  console.log(chalk.yellow('⚠ Gemini API Key dihapus dari config.'))
  console.log(chalk.gray('  AI Quality Gate akan dilewati saat lumbung push.'))
}

// --------------------------------------------------------------------------
// Tampilkan status config
// --------------------------------------------------------------------------
export function showConfig() {
  const cfg = getConfig()
  const geminiKey = getGeminiApiKey()
  const isEnvKey = !!process.env.GEMINI_API_KEY

  console.log('')
  console.log(chalk.gray('─'.repeat(50)))
  console.log(chalk.bold('⚙  Lumbung CLI — Konfigurasi Tersimpan'))
  console.log(chalk.gray('─'.repeat(50)))

  // Auth status
  if (cfg.email) {
    console.log(`  ${chalk.cyan('Akun:')}        ${chalk.green('✓')} ${cfg.email}`)
  } else {
    console.log(`  ${chalk.cyan('Akun:')}        ${chalk.yellow('Belum login')} (jalankan: lumbung login)`)
  }

  // Gemini AI Key status
  if (geminiKey) {
    let source
    if (isEnvKey) {
      source = chalk.blue('env variable GEMINI_API_KEY')
    } else if (cfg.geminiApiKey) {
      source = chalk.magenta('lumbung config set-ai-key')
    } else {
      source = chalk.gray('bundled default (plug & play)')
    }
    const masked = `${geminiKey.slice(0, 8)}${'*'.repeat(20)}`
    console.log(`  ${chalk.cyan('Gemini Key:')}  ${chalk.green('✓')} ${masked} ${chalk.gray(`(dari ${source})`)}`)
  } else {
    console.log(`  ${chalk.cyan('Gemini Key:')}  ${chalk.yellow('Tidak diset')} ${chalk.gray('→ AI Quality Gate dilewati')}`)
    console.log(`              ${chalk.gray('Jalankan: lumbung config set-ai-key <API_KEY>')}`)
  }

  console.log(chalk.gray('─'.repeat(50)))
  console.log('')
}
