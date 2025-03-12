import appInsights from 'applicationinsights'
import * as insights from '../../../app/insights.js'

jest.mock('applicationinsights', () => ({
  setup: jest.fn()
}))

describe('App Insight', () => {
  const startMock = jest.fn()
  const setupMock = jest.fn(() => {
    return {
      start: startMock
    }
  })
  appInsights.setup = setupMock
  const cloudRoleTag = 'cloudRoleTag'
  const tags = {}
  appInsights.defaultClient = {
    context: {
      keys: {
        cloudRole: cloudRoleTag
      },
      tags
    },
    trackException: jest.fn()
  }

  const appInsightsKey = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING

  beforeEach(() => {
    delete process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
  })

  afterAll(() => {
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = appInsightsKey
  })

  test('is started when env var exists', () => {
    const consoleLogSpy = jest.spyOn(console, 'log')
    const appName = 'test-app'
    process.env.APPINSIGHTS_CLOUDROLE = appName
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'something'

    insights.setup()

    expect(setupMock).toHaveBeenCalledTimes(1)
    expect(startMock).toHaveBeenCalledTimes(1)
    expect(tags[cloudRoleTag]).toEqual(appName)
    expect(consoleLogSpy).toHaveBeenCalledTimes(1)
    expect(consoleLogSpy).toHaveBeenCalledWith('App Insights Running')
  })

  test('logs not running when env var does not exist', () => {
    const consoleLogSpy = jest.spyOn(console, 'log')

    insights.setup()

    expect(consoleLogSpy).toHaveBeenCalledTimes(1)
    expect(consoleLogSpy).toHaveBeenCalledWith('App Insights Not Running!')
  })
})
