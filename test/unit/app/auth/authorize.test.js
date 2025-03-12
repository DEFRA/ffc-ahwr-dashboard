import { requestAuthorizationCodeUrl } from '../../../../app/auth/auth-code-grant/request-authorization-code-url.js'
import { authenticate } from '../../../../app/auth/authenticate.js'
import { verifyState } from '../../../../app/auth/auth-code-grant/state.js'

jest.mock('../../../../app/session')
jest.mock('../../../../app/auth/auth-code-grant/state')

jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn() }, dispose: jest.fn() }))

describe('Generate authentication url test', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  test('when requestAuthorizationCodeUrl with pkce true challenge parameter added', async () => {
    const result = requestAuthorizationCodeUrl(undefined)
    const params = new URL(result).searchParams
    expect(params.get('code_challenge')).not.toBeNull()
  })

  test('when requestAuthorizationCodeUrl with pkce false no challenge parameter is added', async () => {
    const result = requestAuthorizationCodeUrl(undefined, undefined, false)
    const params = new URL(result).searchParams
    expect(params.get('code_challenge')).toBeNull()
  })

  test('when invalid state error is thrown', async () => {
    verifyState.mockReturnValueOnce(false)
    const request = { yar: { id: '33' }, logger: { setBindings: jest.fn() } }
    try {
      await authenticate(request)
    } catch (e) {
      expect(e.message).toBe('Invalid state')
      expect(verifyState).toHaveBeenCalledWith(request)
    }
  })
})
