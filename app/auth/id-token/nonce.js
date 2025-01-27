import { randomUUID } from 'node:crypto'
import { getToken, setToken } from '../../session/index.js'
import { keys } from '../../session/keys.js'

export const generate = (request) => {
  const nonce = randomUUID()
  setToken(request, keys.tokens.nonce, nonce)
  return nonce
}

export const verify = (request, idToken) => {
  if (typeof idToken === 'undefined') {
    throw new Error('Empty id_token')
  }
  const nonce = getToken(request, keys.tokens.nonce)
  if (!nonce) {
    throw new Error('HTTP Session contains no nonce')
  }
  if (nonce !== idToken.nonce) {
    throw new Error('Nonce mismatch')
  }
}
