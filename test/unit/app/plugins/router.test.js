import { createServer } from '../../../../app/server.js'

describe('routes plugin test', () => {
  test('routes included', async () => {
    jest.mock('../../../../app/config', () => ({
      ...jest.requireActual('../../../../app/config'),
      endemics: {
        enabled: true
      }
    }))

    const server = await createServer()
    const routePaths = []
    server.table().forEach((element) => {
      routePaths.push(element.path)
    })
    expect(routePaths).toEqual([
      '/check-details', '/cookies', '/healthy', '/healthz', '/signin-oidc', '/update-details', '/vet-visits', '/', '/assets/{path*}', '/download-application/{sbi}/{reference}', '/check-details', '/cookies'
    ])
  })
})
