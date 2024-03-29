const HttpStatus = require('http-status-codes')
describe('Healthz test', () => {
  test('GET /healthz route returns 200', async () => {
    const options = {
      method: 'GET',
      url: '/healthz'
    }

    const response = await global.__SERVER__.inject(options)
    expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK)
  })
})
