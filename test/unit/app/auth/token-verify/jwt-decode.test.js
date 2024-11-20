const jwt = require('jsonwebtoken')
const decodeJwt = require('../../../../../app/auth/token-verify/jwt-decode')

describe('decodeJwt function', () => {
  const mockToken = 'mock.jwt.token'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should decode a JWT token successfully', () => {
    // Mock jwt.decode to return a successful response
    const mockDecodedToken = { payload: 'decodedPayload' }
    jwt.decode = jest.fn().mockReturnValue({ payload: mockDecodedToken })

    const decodedToken = decodeJwt(mockToken)

    expect(jwt.decode).toHaveBeenCalledWith(mockToken, { complete: true })
    expect(decodedToken).toEqual(mockDecodedToken)
  })

  it('should return throw an error if the token cannot be decoded', () => {
    jwt.decode.mockReturnValue(null)

    expect(() => {
      decodeJwt(mockToken)
    }).toThrow('The token has not been decoded')
  })
})
