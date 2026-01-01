/**
 * Config Storage - Stores API credentials locally
 */

import Conf from 'conf'

const config = new Conf({
  projectName: 'codehaven-cli',
  schema: {
    accessToken: { type: 'string', default: '' },
    refreshToken: { type: 'string', default: '' },
    email: { type: 'string', default: '' },
    userId: { type: 'string', default: '' }
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
    accessToken: config.get('accessToken'),
    refreshToken: config.get('refreshToken'),
    email: config.get('email'),
    userId: config.get('userId')
  }
}

export function clearCredentials() {
  config.clear()
}

export function isLoggedIn() {
  return !!config.get('accessToken')
}
