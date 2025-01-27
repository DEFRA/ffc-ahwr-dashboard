import crypto from 'crypto'
import { keys } from '../../session/keys.js'
import { setPkcecodes } from '../../session/index.js'

const base64URLEncode = (str) => {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

const sha256 = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest()
}

export const generateCodeChallenge = (request) => {
  const verifier = base64URLEncode(crypto.randomBytes(32))
  const codeChallenge = base64URLEncode(sha256(verifier))
  setPkcecodes(request, keys.pkcecodes.verifier, verifier)
  return codeChallenge
}
