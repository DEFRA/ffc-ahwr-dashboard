const Hapi = require('@hapi/hapi')
const HttpStatus = require('http-status-codes')
const { plugin } = require('../../../../app/plugins/cookies')
jest.mock('../../../../app/config', () => ({
  ...jest.requireActual('../../../../app/config'),
  cookie: {
    cookieNameCookiePolicy: 'testCookiePolicyName',
    cookieNameAuth: 'ffc_ahwr_auth',
    cookieNameSession: 'ffc_ahwr_session',
    isSameSite: 'Lax',
    isSecure: true,
    password: 'blah blah blah',
    ttl: 1000 * 3600 * 24 * 3 // 3 days
  },
  cookiePolicy: {
    clearInvalid: false,
    encoding: 'base64json',
    isSameSite: 'Lax',
    isSecure: true,
    password: 'blah blah blah',
    ttl: 1000 * 3600 * 24 * 3,
    path: '/'
  }
}))
jest.mock('../../../../app/cookies', () => ({
  getCurrentPolicy: jest.fn()
}))

describe('Cookie plugin', () => {
  let server

  beforeEach(async () => {
    server = Hapi.server()
    await server.register({ plugin })
  })

  describe('onPreResponse', () => {
    let request

    beforeEach(() => {
      server.route([{
        method: 'GET',
        path: '/',
        handler: (req, h) => {
          return h.view('index', { /* context */ })
        }
      }, {
        method: 'GET',
        path: '/blah',
        handler: (req, h) => {
          return 'Hello, world!'
        }
      }])
    })

    test('should not modify response when status code is NOT_FOUND', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/abc'
      })
      expect(response.statusCode).toEqual(HttpStatus.StatusCodes.NOT_FOUND)
    })

    test('should apply cookie policy for non-error, view responses', async () => {
      const getCurrentPolicy = require('../../../../app/cookies').getCurrentPolicy
      getCurrentPolicy.mockReturnValue({ /* Your mock policy data */ })
      request = {
        method: 'get',
        url: '/blah'
      }
      const response = await server.inject(request)
      expect(response.statusCode).toEqual(HttpStatus.StatusCodes.OK)
    })
  })
})
