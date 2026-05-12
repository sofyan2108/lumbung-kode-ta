/**
 * Config Storage - Stores API credentials locally
 */

import Conf from 'conf'
import { GEMINI_API_KEY as BUNDLED_GEMINI_KEY } from './constants.js'

const config = new Conf({
  projectName: 'lumbung-cli',
  schema: {
    accessToken:   { type: 'string', default: '' },
    refreshToken:  { type: 'string', default: '' },
    email:         { type: 'string', default: '' },
    userId:        { type: 'string', default: '' },
    geminiApiKey:  { type: 'string', default: '' }  // AI Quality Gate key
  }
})

export function saveCredentials(accessToken, refreshToken, email, userId) {
  config.set('accessToken', accessToken)
  config.set('refreshToken', refreshToken)
  config.set('email', email)
  config.set('userId', userId)
}

export function getConfig() {
  return {
    accessToken:  config.get('accessToken'),
    refreshToken: config.get('refreshToken'),
    email:        config.get('email'),
    userId:       config.get('userId'),
    geminiApiKey: config.get('geminiApiKey')
  }
}

export function saveGeminiApiKey(key) {
  config.set('geminiApiKey', key)
}

export function getGeminiApiKey() {
  // Prioritas 1: env variable (CI/CD, power user)
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY
  // Prioritas 2: key yang disimpan user via `lumbung config set-ai-key`
  const saved = config.get('geminiApiKey')
  if (saved) return saved
  // Prioritas 3: key bawaan yang di-bundle (plug & play untuk semua pengguna npm)
  return BUNDLED_GEMINI_KEY || null
}

export function clearCredentials() {
  config.clear()
}

export function isLoggedIn() {
  return !!config.get('accessToken')
}
