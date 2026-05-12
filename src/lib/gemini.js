/**
 * src/lib/gemini.js
 * Modul integrasi Google Gemini AI untuk Lumbung Kode (Web App)
 *
 * Berisi dua fungsi utama:
 *  - analyzeCodeWithAI  : Menganalisis kode dan mengisi metadata otomatis.
 *  - validateCodeWithAI : AI Quality Gate — memvalidasi apakah konten adalah kode/teknis yang valid.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null

// --------------------------------------------------------------------------
// Helper: dapatkan model yang tersedia, dengan fallback
// --------------------------------------------------------------------------
async function getAvailableModel() {
  const DEFAULT_MODEL = 'gemini-1.5-flash'

  if (!genAI) {
    throw new Error(
      'API Key Google Gemini belum dikonfigurasi. Silakan cek file .env.local Anda.'
    )
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
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
    // Diam-diam fallback ke default
  }

  return DEFAULT_MODEL
}

// --------------------------------------------------------------------------
// Helper: panggil model dengan retry otomatis saat 503 overloaded
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
        console.warn(`Gemini overloaded, retry ${attempt}/${maxRetries} dalam ${wait}ms…`)
        await new Promise((r) => setTimeout(r, wait))
      } else {
        throw is503
          ? new Error('Server AI sedang sibuk (Overloaded). Silakan coba sesaat lagi.')
          : err
      }
    }
  }
}

// --------------------------------------------------------------------------
// Helper: parse JSON aman dari respons Gemini (hapus blok markdown jika ada)
// --------------------------------------------------------------------------
function parseGeminiJson(rawText) {
  const cleaned = rawText.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    throw new Error('Respons AI tidak dalam format JSON yang valid. Coba lagi.')
  }
}

// --------------------------------------------------------------------------
// Fungsi 1: Analisis Kode → Isi Metadata Otomatis
// --------------------------------------------------------------------------
/**
 * Menganalisis kode dan mengembalikan metadata (title, language, description,
 * tags, dependencies, usage_example).
 * @param {string} codeSnippet
 * @returns {Promise<object>}
 */
export async function analyzeCodeWithAI(codeSnippet) {
  if (!genAI) {
    throw new Error('API Key Google Gemini belum dikonfigurasi.')
  }

  const modelName = await getAvailableModel()
  const model = genAI.getGenerativeModel({ model: modelName })

  const prompt = `
Analyze the following code snippet and return a JSON object (without Markdown formatting).
The JSON must have these keys:
1. "title": A short, descriptive title (max 50 chars).
2. "language": The programming language (lowercase, e.g., "javascript", "python", "html", "css").
3. "description": A concise explanation of what the code does (max 200 chars, in Indonesian language).
4. "tags": An array of 3-5 keywords relevant to the code (lowercase).
5. "dependencies": An array of library/package names used in the code. Return [] if none.
6. "usage_example": A short code example showing how to use this snippet (max 150 chars). Return "" if not applicable.

Code to analyze:
${codeSnippet}
  `.trim()

  const rawText = await generateWithRetry(model, prompt)
  return parseGeminiJson(rawText)
}

// --------------------------------------------------------------------------
// Fungsi 2: AI Quality Gate — Validasi Konten Sebelum Upload
// --------------------------------------------------------------------------
/**
 * Memvalidasi apakah konten adalah kode/file teknis yang valid.
 *
 * @param {string} content  - Konten file yang akan diupload
 * @returns {Promise<{
 *   isValid: boolean,
 *   reason: string,
 *   confidenceScore: number,
 *   metadata: { title: string, language: string }
 * }>}
 */
export async function validateCodeWithAI(content) {
  if (!genAI) {
    // Jika API Key tidak ada, lewati validasi (graceful degradation)
    console.warn('Gemini API Key tidak ada, AI Quality Gate dilewati.')
    return {
      isValid: true,
      reason: '',
      confidenceScore: 1.0,
      metadata: { title: '', language: '' },
    }
  }

  const modelName = await getAvailableModel()
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

    // Pastikan struktur output sesuai kontrak
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
    }
  } catch (err) {
    // Jika AI gagal merespons, jangan blokir upload — log error saja
    console.error('AI Quality Gate gagal, melewati validasi:', err.message)
    return {
      isValid: true,
      reason: '',
      confidenceScore: 1.0,
      metadata: { title: '', language: '' },
    }
  }
}
