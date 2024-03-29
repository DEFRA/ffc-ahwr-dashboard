describe('routes plugin test', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  test('routes included', async () => {
    const createServer = require('../../../../app/server')
    const server = await createServer()
    const routePaths = []
    server.table().forEach(element => {
      routePaths.push(element.path)
    })
    expect(routePaths).toEqual([
      '/check-details', '/cookies', '/healthy', '/healthz', '/signin-oidc', '/update-details', '/vet-visits', '/', '/assets/{path*}', '/check-details', '/cookies'
    ])
  })
})
