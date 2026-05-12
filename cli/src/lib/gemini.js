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
// Fungsi Utama: AI Quality Gate — Validasi Konten Sebelum Upload
// --------------------------------------------------------------------------
/**
 * Memvalidasi apakah konten adalah kode/file teknis yang valid.
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
  const apiKey = getApiKey()

  // Jika tidak ada API Key, lewati validasi (graceful degradation)
  if (!apiKey) {
    return {
      isValid: true,
      reason: '',
      confidenceScore: 1.0,
      metadata: { title: '', language: '' },
      skipped: true, // Flag: validasi AI tidak dijalankan
    }
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const modelName = await getAvailableModel(apiKey)
  const model = genAI.getGenerativeModel({ model: modelName })

  const prompt = `
Kamu adalah asisten validasi kode tingkat lanjut untuk platform penyimpanan snippet kode bernama "Lumbung Kode".

Tugasmu: Periksa apakah konten di bawah ini adalah kode program atau file teknis yang VALID dan layak disimpan.

KRITERIA PENOLAKAN (isValid = false):
- Teks acak / gibberish (contoh: "asdfjkl qwerty zxcv")
- Teks dummy / placeholder (contoh: "lorem ipsum", "tes 123", "hello world" tanpa konteks kode)
- Kalimat percakapan biasa / bukan kode (contoh: "halo apa kabar", "ini adalah teks biasa")
- Fragmen kode yang terlalu pendek dan tidak bermakna (kurang dari 3 baris logika nyata)
- Konten yang jelas bukan kode, konfigurasi, atau dokumentasi teknis

KRITERIA PENERIMAAN (isValid = true):
- Struktur bahasa pemrograman yang benar (variabel, fungsi, loop, kondisi, class, dll.)
- File konfigurasi yang valid (JSON, YAML, TOML, Dockerfile, .env, nginx.conf, dll.)
- Dokumentasi teknis (Markdown dengan blok kode, README yang berisi instruksi teknis)
- Query database (SQL, MongoDB query, dll.)
- Shell script / command-line script
- Template markup (HTML, XML, SVG dengan logika)

FORMAT OUTPUT: Kembalikan HANYA JSON murni tanpa blok markdown, persis seperti ini:
{
  "isValid": true,
  "reason": "",
  "confidenceScore": 0.95,
  "metadata": {
    "title": "Judul singkat deskriptif (maks 60 karakter)",
    "language": "bahasa_pemrograman_lowercase"
  }
}

Jika isValid false, isi "reason" dengan penjelasan singkat dalam Bahasa Indonesia mengapa konten ditolak.
Jika isValid true, kosongkan "reason" (string kosong "").
confidenceScore adalah tingkat keyakinan kamu (0.0 sampai 1.0).

Konten untuk divalidasi:
---
${content.slice(0, 8000)}
---
  `.trim()

  try {
    const rawText = await generateWithRetry(model, prompt)
    const result = parseGeminiJson(rawText)

    return {
      isValid: typeof result.isValid === 'boolean' ? result.isValid : true,
      reason: result.reason || '',
      confidenceScore:
        typeof result.confidenceScore === 'number'
          ? Math.min(1, Math.max(0, result.confidenceScore))
          : 0.5,
      metadata: {
        title: result.metadata?.title || '',
        language: result.metadata?.language || '',
      },
      skipped: false,
    }
  } catch (err) {
    // Jika Gemini gagal merespons, jangan blokir upload — lempar error agar push.js bisa handle
    throw new Error(`AI Quality Gate error: ${err.message}`)
  }
}
