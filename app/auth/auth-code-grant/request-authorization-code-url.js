import { authConfig } from '../../config/auth.js'
import { generate as generateNonce } from '../id-token/nonce.js'
import { generate as generateState } from './state.js'
import { generateCodeChallenge } from './proof-key-for-code-exchange.js'

export const requestAuthorizationCodeUrl = (request, source = 'dashboard', useProofKeyForCodeExchange = true) => {
  const url = new URL(
    `${authConfig.defraId.hostname}${authConfig.defraId.oAuthAuthorisePath}`
  )
  url.searchParams.append('p', authConfig.defraId.policy)
  url.searchParams.append('client_id', authConfig.defraId.clientId)
  url.searchParams.append('nonce', generateNonce(request))
  url.searchParams.append('redirect_uri', authConfig.defraId.redirectUri)
  url.searchParams.append('scope', authConfig.defraId.scope)
  url.searchParams.append('response_type', 'code')
  url.searchParams.append('serviceId', authConfig.defraId.serviceId)
  url.searchParams.append('state', generateState(request, source))
  url.searchParams.append('forceReselection', true)
  if (useProofKeyForCodeExchange) {
    // Used to secure authorization code grants by using Proof Key for Code Exchange (PKCE)
    const codeChallenge = generateCodeChallenge(request)
    url.searchParams.append('code_challenge', codeChallenge)
    url.searchParams.append('code_challenge_method', 'S256')
  }
  return url
}
