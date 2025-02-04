const appInsights = {
  defaultClient: {
    trackEvent: jest.fn(),
    trackException: jest.fn()
  },
  setup: function () { return this },
  start: jest.fn()
}

export default appInsights
