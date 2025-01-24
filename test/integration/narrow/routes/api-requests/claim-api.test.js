const { http, HttpResponse } = require('msw')
const { setupServer } = require('msw/node')
const { applicationApi } = require('../../../../../app/config')
const {
  getClaimsByApplicationReference,
  isWithinLastTenMonths
} = require('../../../../../app/api-requests/claim-api')

const mswServer = setupServer()
mswServer.listen()

afterEach(() => {
  mswServer.resetHandlers()
})

afterAll(() => {
  mswServer.close()
})

test('getClaimsByApplicationReference: throws returned errors', async () => {
  const logger = {
    setBindings: jest.fn()
  }

  const reference = 'AHWR-1010-1010'

  const appService = http.get(
    `${applicationApi.uri}/claim/get-by-application-reference/${reference}`,
    () => new HttpResponse(null, {
      status: 400,
      statusText: 'Bad Request'
    })
  )

  mswServer.use(appService)

  await expect(getClaimsByApplicationReference(reference, logger))
    .rejects.toThrow('Response Error: 400 Bad Request')
})

test('isWithinLastTenMonths: returns false if given no date', () => {
  expect(isWithinLastTenMonths()).toBe(false)
})