/**
 * cli/src/lib/gemini.js
 * Modul integrasi Google Gemini AI untuk CLI Lumbung Kode
 *
 * Fungsi:
 *  - validateCodeWithAI : AI Quality Gate — memvalidasi apakah konten adalah kode/teknis yang valid.
 *
 * Konfigurasi API Key:
 *  Simpan Gemini API Key di variabel lingkungan GEMINI_API_KEY,
 *  atau di file ~/.lumbung-config (dikelola oleh config.js).
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { getGeminiApiKey } from './config.js'

// --------------------------------------------------------------------------
// Ambil API Key: env variable (prioritas) atau config tersimpan
// --------------------------------------------------------------------------
function getApiKey() {
  return getGeminiApiKey()
}

// --------------------------------------------------------------------------
// Helper: auto-detect model Gemini yang tersedia
// --------------------------------------------------------------------------
async function getAvailableModel(apiKey) {
  const DEFAULT_MODEL = 'gemini-1.5-flash'

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    )
    const data = await res.json()
    if (data.models) {
      const valid = data.models.find(
        (m) =>
          m.name.includes('gemini') &&
          m.supportedGenerationMethods?.includes('generateContent')
      )
      if (valid) return valid.name.replace('models/', '')
    }
  } catch {
    // Fallback ke default
  }

  return DEFAULT_MODEL
}

// --------------------------------------------------------------------------
// Helper: panggil model dengan retry saat 503 overloaded
// --------------------------------------------------------------------------
async function generateWithRetry(model, prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (err) {
      const is503 =
        err.message?.includes('503') || err.message?.includes('overloaded')
      if (is503 && attempt < maxRetries) {
        const wait = attempt * 2000
        await new Promise((r) => setTimeout(r, wait))
      } else {
        throw is503
          ? new Error('Server AI sedang sibuk. Silakan coba lagi sesaat lagi.')
          : err
      }
    }
  }
}

// --------------------------------------------------------------------------
// Helper: parse JSON aman dari respons Gemini
// --------------------------------------------------------------------------
function parseGeminiJson(rawText) {
  const cleaned = rawText.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    throw new Error('Respons AI tidak dalam format JSON yang valid.')
  }
}

// --------------------------------------------------------------------------
// Helper: local pre-check heuristik SEBELUM memanggil AI
// Menangkap konten sampah yang sangat jelas tanpa buang quota API
// --------------------------------------------------------------------------
function localPreCheck(content) {
  const text = content.trim()

  // Terlalu pendek (kurang dari 20 karakter) → pasti bukan kode berarti
  if (text.length < 20) {
    return { pass: false, reason: 'Konten terlalu pendek untuk menjadi kode yang valid.' }
  }

  // Deteksi pola kode teknis yang umum
  const codeSignals = [
    /[{}[\]();]/, // kurung kode
    /\b(function|const|let|var|def|class|import|export|return|if|else|for|while)\b/,
    /\b(public|private|static|void|int|string|bool|async|await)\b/,
    /[=><+\-*/%!&|^~]/, // operator
    /<\w+[\s/>]/, // HTML/XML tag
    /^\s*#[\w\s]/, // shebang atau comment python/bash
    /:\s*\w+/, // YAML / TypeScript type annotation
    /\w+\s*\(.*\)/, // function call
  ]
  const hasCodeSignals = codeSignals.some((pattern) => pattern.test(text))
  if (hasCodeSignals) return { pass: true, reason: '' }

  // Cek karakter rasio: kode biasanya punya banyak simbol
  const symbolCount = (text.match(/[^a-zA-Z0-9\s]/g) || []).length
  const symbolRatio = symbolCount / text.length
  if (symbolRatio > 0.08) return { pass: true, reason: '' }

  // Tidak ada sinyal kode sama sekali → suspect
  // Serahkan ke AI untuk keputusan final (jangan blokir di sini)
  return { pass: null, reason: '' } // null = tidak yakin, teruskan ke AI
}

// --------------------------------------------------------------------------
// Fungsi Utama: AI Quality Gate — Validasi Konten Sebelum Upload
// --------------------------------------------------------------------------
/**
 * Memvalidasi apakah konten adalah kode/file teknis yang valid.
 * Urutan: local pre-check → AI validation
 *
 * @param {string} content  - Konten file yang akan diupload
 * @returns {Promise<{
 *   isValid: boolean,
 *   reason: string,
 *   confidenceScore: number,
 *   metadata: { title: string, language: string },
 *   skipped: boolean
 * }>}
 */
export async function validateCodeWithAI(content) {
  // ── Local Pre-Check (tanpa API) ─────────────────────────────────────────
  const preCheck = localPreCheck(content)
  if (preCheck.pass === false) {
    return {
      isValid: false,
      reason: preCheck.reason,
      confidenceScore: 0.0,
      metadata: { title: '', language: '' },
      skipped: false
    }
  }

  const apiKey = getApiKey()

  // Jika tidak ada API Key, lewati validasi (graceful degradation)
  if (!apiKey) {
    return {
      isValid: true,
      reason: '',
      confidenceScore: 1.0,
      metadata: { title: '', language: '' },
      skipped: true,
    }
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const modelName = await getAvailableModel(apiKey)
  const model = genAI.getGenerativeModel({ model: modelName })

  const prompt = `
Kamu adalah sistem validasi KETAT untuk platform penyimpanan snippet kode "Lumbung Kode".
Tugasmu SATU-SATUNYA: tentukan apakah konten di bawah adalah kode/file teknis yang LAYAK disimpan.

TOLAK (isValid = false) konten seperti ini:
- Kalimat bahasa Indonesia biasa: "ini adalah teks dummy", "halo apa kabar", "harusnya gabisa upload"
- Kalimat bahasa Inggris biasa: "this is a test", "hello world" (tanpa struktur kode)
- Teks acak: "asdf qwerty zxcv", "aaabbbccc"
- Lorem ipsum dan sejenisnya
- Catatan atau komentar saja tanpa kode (misal: "nanti diisi", "TODO")
- Kalimat yang mendeskripsikan kode tapi bukan kode itu sendiri

TERIMA (isValid = true) konten seperti ini:
- Kode pemrograman (Python, JS, Java, C++, PHP, dll.) dengan sintaks yang benar
- File konfigurasi: JSON valid, YAML, Dockerfile, .env, nginx.conf
- Query SQL: SELECT, INSERT, UPDATE, CREATE TABLE
- Shell script: bash, powershell, bat
- Markup dengan logika: HTML dengan JS, XML, JSX
- Markdown HANYA jika memiliki blok kode (``` ... ```)

PENTING: Jika ragu antara "kalimat biasa" vs "kode", TOLAK saja (isValid = false).

KEMBALIKAN HANYA JSON INI (tanpa markdown, tanpa penjelasan):
{"isValid":BOOLEAN,"reason":"ALASAN_JIKA_DITOLAK","confidenceScore":ANGKA_0_SAMPAI_1,"metadata":{"title":"JUDUL_SINGKAT","language":"bahasa_lowercase"}}

Konten:
---
${content.slice(0, 6000)}
---
  `.trim()

  try {
    const rawText = await generateWithRetry(model, prompt)
    const result = parseGeminiJson(rawText)

    // Validasi tipe data hasil — jika AI mengembalikan string "true"/"false"
    const isValid = result.isValid === true || result.isValid === 'true'
    const score = typeof result.confidenceScore === 'number'
      ? Math.min(1, Math.max(0, result.confidenceScore))
      : (isValid ? 0.8 : 0.2)

    return {
      isValid,
      reason: result.reason || '',
      confidenceScore: score,
      metadata: {
        title: result.metadata?.title || '',
        language: result.metadata?.language || '',
      },
      skipped: false,
    }
  } catch (err) {
    // Jika Gemini gagal merespons, lempar error agar push.js bisa handle
    throw new Error(`AI Quality Gate error: ${err.message}`)
  }
}

