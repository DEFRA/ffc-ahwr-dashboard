jest.mock('@hapi/wreck')
jest.mock('form-data')
jest.mock('applicationinsights', () => ({
  defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() },
  dispose: jest.fn()
}))

jest.mock('../../../../../app/config', () => ({
  ...jest.requireActual('../../../../../app/config'),
  authConfig: {
    defraId: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      scope: 'test-scope',
      redirectUri: 'test-redirect-uri',
      hostname: 'https://test.auth.hostname',
      policy: 'test-policy'
    },
    ruralPaymentsAgency: {
      hostname: 'dummy-host-name',
      getPersonSummaryUrl: 'dummy-get-person-summary-url',
      getOrganisationPermissionsUrl: 'dummy-get-organisation-permissions-url',
      getOrganisationUrl: 'dummy-get-organisation-url'
    }
  }
}))
jest.mock('../../../../../app/session', () => ({
  getPkcecodes: jest.fn()
}))
jest.mock('../../../../../app/session/keys', () => ({
  pkcecodes: {
    verifier: 'test-verifier'
  },
  endemicsClaim: {
    organisation: {
      organisationKey: 1234567
    }
  }
}))

const wreck = require('@hapi/wreck')
const FormData = require('form-data')
const config = require('../../../../../app/config')
const session = require('../../../../../app/session')
const redeemAuthorizationCodeForAccessToken = require('../../../../../app/auth/auth-code-grant/redeem-authorization-code-for-access-token')

describe('redeemAuthorizationCodeForAccessToken', () => {
  const mockRequest = {
    query: {
      code: 'test-code'
    },
    logger: {
      setBindings: jest.fn()
    }
  }

  beforeEach(() => {
    session.getPkcecodes.mockReturnValue('test-code-verifier')
    FormData.prototype.append = jest.fn() // Mock append method of form-data
  })

  it('successfully redeems authorization code for access token', async () => {
    const mockResponsePayload = { access_token: 'test-access-token' }
    wreck.post.mockResolvedValue({
      res: { statusCode: 200 },
      payload: mockResponsePayload
    })

    const result = await redeemAuthorizationCodeForAccessToken(mockRequest)
    expect(result).toEqual(mockResponsePayload)
    expect(wreck.post).toHaveBeenCalledWith(
      `${config.authConfig.defraId.hostname}/${config.authConfig.defraId.policy}/oauth2/v2.0/token`,
      expect.anything()
    )
    expect(FormData.prototype.append).toHaveBeenCalledWith('code', 'test-code')
  })

  it('throws an error when HTTP request fails', async () => {
    const response = {
      res: { statusCode: 400, statusMessage: 'Bad Request' },
      payload: {}
    }
    wreck.post.mockRejectedValue(response)

    await expect(redeemAuthorizationCodeForAccessToken(mockRequest))
      .rejects.toEqual(response)
  })

  it('sends correct form data in the request', async () => {
    const mockResponsePayload = { access_token: 'test-access-token' }
    wreck.post.mockResolvedValue({
      res: { statusCode: 200 },
      payload: mockResponsePayload
    })

    await redeemAuthorizationCodeForAccessToken(mockRequest)

    // Assuming FormData.append was mocked as shown previously
    expect(FormData.prototype.append).toHaveBeenCalledWith('client_id', config.authConfig.defraId.clientId)
    expect(FormData.prototype.append).toHaveBeenCalledWith('client_secret', config.authConfig.defraId.clientSecret)
    expect(FormData.prototype.append).toHaveBeenCalledWith('scope', config.authConfig.defraId.scope)
    expect(FormData.prototype.append).toHaveBeenCalledWith('code', mockRequest.query.code)
    expect(FormData.prototype.append).toHaveBeenCalledWith('grant_type', 'authorization_code')
    expect(FormData.prototype.append).toHaveBeenCalledWith('redirect_uri', config.authConfig.defraId.redirectUri)
    expect(FormData.prototype.append).toHaveBeenCalledWith('code_verifier', 'test-code-verifier')
  })
  it('handles network or other errors during HTTP request', async () => {
    const errorMessage = 'Network error'
    wreck.post.mockRejectedValue(new Error(errorMessage))

    await expect(redeemAuthorizationCodeForAccessToken(mockRequest)).rejects.toThrow(errorMessage)
  })
})
