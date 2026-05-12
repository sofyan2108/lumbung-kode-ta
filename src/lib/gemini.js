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
// Fungsi 2: AI Quality Gate — Validasi Konten Sebelum Upload
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
 *   metadata: { title: string, language: string }
 * }>}
 */
export async function validateCodeWithAI(content) {
  // ── Local Pre-Check (tanpa API) ─────────────────────────────────────────
  const preCheck = localPreCheck(content)
  if (preCheck.pass === false) {
    // Pasti bukan kode, tolak langsung
    return {
      isValid: false,
      reason: preCheck.reason,
      confidenceScore: 0.0,
      metadata: { title: '', language: '' },
    }
  }

  // ── Jika tidak ada API Key → lewati AI, tapi catat flag ─────────────────
  if (!genAI) {
    console.warn('[AI Gate] API Key tidak ada → validasi dilewati.')
    return {
      isValid: true,
      reason: '',
      confidenceScore: 1.0,
      metadata: { title: '', language: '' },
      skipped: true,
    }
  }

  // ── AI Validation ────────────────────────────────────────────────────────
  const modelName = await getAvailableModel()
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
- Markdown HANYA jika memiliki blok kode (\`\`\` ... \`\`\`)

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
    console.log('[AI Gate] Raw response:', rawText.slice(0, 200))

    const result = parseGeminiJson(rawText)
    console.log('[AI Gate] Parsed result:', result)

    // Validasi tipe data hasil — jika AI mengembalikan string "true"/"false"
    const isValid = result.isValid === true || result.isValid === 'true'
    const score = typeof result.confidenceScore === 'number'
      ? Math.min(1, Math.max(0, result.confidenceScore))
      : (isValid ? 0.8 : 0.2) // jika score tidak ada, inferensikan dari isValid

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
    // API Key ada tapi panggilan gagal → TOLAK upload, jangan bypass
    console.error('[AI Gate] Error:', err.message)
    throw new Error(`Validasi AI gagal: ${err.message}`)
  }
}

