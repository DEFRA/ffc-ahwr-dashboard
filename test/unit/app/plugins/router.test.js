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
      '/accessibility', '/cookies', '/healthy', '/healthz', '/org-review', '/privacy-policy', '/signin-oidc', '/terms', '/view-all', '/', '/assets/{path*}', '/terms/v1', '/terms/v2', '/terms/v3', '/view-application/{reference}', '/cookies', '/org-review'
    ])
  })
})
