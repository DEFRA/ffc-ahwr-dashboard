import { randomUUID } from 'node:crypto'
import { getToken, setToken } from '../../session/index.js'
import { keys } from '../../session/keys.js'
import { config } from '../../config/index.js'

export const generate = (request, source = 'dashboard') => {
  const state = {
    id: randomUUID(),
    namespace: config.namespace,
    source
  }

  const base64EncodedState = Buffer.from(JSON.stringify(state)).toString('base64')
  setToken(request, keys.tokens.state, base64EncodedState)
  return base64EncodedState
}

export const verifyState = (request) => {
  if (!request.query.error) {
    const state = request.query.state
    if (!state) {
      return false
    }
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('ascii'))
    const sessionState = getToken(request, keys.tokens.state)
    if (sessionState === undefined) {
      return false
    }
    const savedState = JSON.parse(Buffer.from(sessionState, 'base64').toString('ascii'))
    return decodedState.id === savedState.id
  } else {
    request.logger.setBindings({ err: request.query.error })
    return false
  }
}
