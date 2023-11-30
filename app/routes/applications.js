const viewTemplate = 'applications'
const currentPath = `/${viewTemplate}`
const { displayPageSize } = require('../pagination')
const Joi = require('joi')
const { setAppSearch, getAppSearch } = require('../session')
const keys = require('../session/keys')
const { administrator, processor, user, recommender, authoriser } = require('../auth/permissions')
const { ViewModel } = require('./models/application-list')
const checkValidSearch = require('../lib/search-validation')
const crumbCache = require('./utils/crumb-cache')

module.exports = [
  {
    method: 'GET',
    path: currentPath,
    options: {
      // auth: { scope: [administrator, processor, user, recommender, authoriser] },
      validate: {
        query: Joi.object({
          page: Joi.number().greater(0).default(1),
          limit: Joi.number().greater(0).default(1)
        })
      },
      handler: async (request, h) => {
        await crumbCache.generateNewCrumb(request, h)
        return h.view(viewTemplate, await new ViewModel(request)) // NOSONAR
      }
    }
  },
  {
    method: 'GET',
    path: `${currentPath}/clear`,
    options: {
      auth: { scope: [administrator, processor, user, recommender, authoriser] },
      handler: async (request, h) => {
        setAppSearch(request, keys.appSearch.filterStatus, [])
        return h.view(viewTemplate, await new ViewModel(request)) // NOSONAR
      }
    }
  },
  {
    method: 'GET',
    path: `${currentPath}/remove/{status}`,
    options: {
      auth: { scope: [administrator, processor, user, recommender, authoriser] },
      validate: {
        params: Joi.object({
          status: Joi.string()
        })
      },
      handler: async (request, h) => {
        let filterStatus = getAppSearch(request, keys.appSearch.filterStatus)
        filterStatus = filterStatus.filter(s => s !== request.params.status)
        setAppSearch(request, keys.appSearch.filterStatus, filterStatus)
        return h.view(viewTemplate, await new ViewModel(request)) // NOSONAR
      }
    }
  },
  {
    method: 'POST',
    path: `${currentPath}`,
    options: {
      auth: { scope: [administrator, processor, user, recommender, authoriser] },
      validate: {
        query: Joi.object({
          page: Joi.number().greater(0).default(1),
          limit: Joi.number().greater(0).default(1)
        })
      },
      handler: async (request, h) => {
        try {
          let filterStatus = []
          // Is Search Button Clicked
          if (!request.payload.submit) {
            filterStatus = request.payload?.status ?? []
            filterStatus = Array.isArray(filterStatus) ? filterStatus : [filterStatus]
          }

          setAppSearch(request, keys.appSearch.filterStatus, filterStatus)
          const { searchText, searchType } = checkValidSearch(request.payload.searchText)
          setAppSearch(request, keys.appSearch.searchText, searchText ?? '')
          setAppSearch(request, keys.appSearch.searchType, searchType ?? '')
          return h.view(viewTemplate, await new ViewModel(request, 1)) // NOSONAR
        } catch (err) {
          return h.view(viewTemplate, { ...request.payload, error: err }).code(400).takeover()
        }
      }
    }
  },
  {
    method: 'GET',
    path: `${currentPath}/sort/{field}/{direction}`,
    options: {
      auth: { scope: [administrator, processor, user, recommender, authoriser] },
      validate: {
        params: Joi.object({
          field: Joi.string(),
          direction: Joi.string()
        })
      },
      handler: async (request, h) => {
        request.params.direction = request.params.direction !== 'descending' ? 'DESC' : 'ASC'
        setAppSearch(request, keys.appSearch.sort, request.params)
        return 1 // NOSONAR
      }
    }
  }
]
