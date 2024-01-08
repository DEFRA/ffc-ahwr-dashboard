const viewTemplate = 'dashboard'
const { ViewModel } = require('./models/application-list')
const crumbCache = require('./utils/crumb-cache')

module.exports = {
  method: 'GET',
  path: '/',
  options: {
    handler: async (request, h) => {
      await crumbCache.generateNewCrumb(request, h)
      return h.view(viewTemplate, await new ViewModel(request, viewTemplate)) // NOSONAR
    }
  }
}
