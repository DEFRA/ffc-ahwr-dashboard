const Joi = require('joi')
const authConfig = require('./auth')
const mqConfig = require('./messaging')
const storageConfig = require('./storage')

const schema = Joi.object({
  appInsights: Joi.object(),
  namespace: Joi.string().optional(),
  cache: {
    expiresIn: Joi.number().default(1000 * 3600 * 24 * 3), // 3 days
    options: {
      host: Joi.string().default('redis-hostname.default'),
      partition: Joi.string().default('ffc-ahwr-frontend'),
      password: Joi.string().allow(''),
      port: Joi.number().default(6379),
      tls: Joi.object()
    }
  },
  cookie: {
    cookieNameCookiePolicy: Joi.string().default('ffc_ahwr_cookie_policy'),
    cookieNameAuth: Joi.string().default('ffc_ahwr_auth'),
    cookieNameSession: Joi.string().default('ffc_ahwr_session'),
    isSameSite: Joi.string().default('Lax'),
    isSecure: Joi.boolean().default(true),
    password: Joi.string().min(32).required(),
    ttl: Joi.number().default(1000 * 3600 * 24 * 3) // 3 days
  },
  cookiePolicy: {
    clearInvalid: Joi.bool().default(false),
    encoding: Joi.string().valid('base64json').default('base64json'),
    isSameSite: Joi.string().default('Lax'),
    isSecure: Joi.bool().default(true),
    password: Joi.string().min(32).required(),
    path: Joi.string().default('/'),
    ttl: Joi.number().default(1000 * 60 * 60 * 24 * 365) // 1 year
  },
  env: Joi.string().valid('development', 'test', 'production').default(
    'development'
  ),
  displayPageSize: Joi.number().default(20),
  googleTagManagerKey: Joi.string().allow(null, ''),
  isDev: Joi.boolean().default(false),
  applicationApiUri: Joi.string().uri(),
  port: Joi.number().default(3000),
  serviceUri: Joi.string().uri(),
  claimServiceUri: Joi.string().uri(),
  applyServiceUri: Joi.string().uri(),
  serviceName: Joi.string().default('Get funding to improve animal health and welfare'),
  useRedis: Joi.boolean().default(false),
  ruralPaymentsAgency: {
    loginUri: Joi.string().uri().default('https://www.ruralpayments.service.gov.uk'),
    callChargesUri: Joi.string().uri().default('https://www.gov.uk/call-charges'),
    email: Joi.string().email().default('ruralpayments@defra.gov.uk'),
    telephone: Joi.string().default('03000 200 301')
  },
  customerSurvey: {
    uri: Joi.string().uri().optional()
  },
  dateOfTesting: {
    enabled: Joi.bool().default(false)
  },
  tenMonthRule: {
    enabled: Joi.bool().default(false)
  },
  applicationApi: require('../api-requests/application-api.config.schema'),
  wreckHttp: {
    timeoutMilliseconds: Joi.number().default(10000)
  },
  endemics: Joi.object({
    enabled: Joi.boolean().default(false)
  }),
  multiSpecies: Joi.object({
    enabled: Joi.boolean().required(),
    releaseDate: Joi.string().required()
  }),
  latestTermsAndConditionsUri: Joi.string().required(),
  reapplyTimeLimitMonths: Joi.number()
})

const config = {
  appInsights: require('applicationinsights'),
  namespace: process.env.NAMESPACE,
  cache: {
    options: {
      host: process.env.REDIS_HOSTNAME,
      password: process.env.REDIS_PASSWORD,
      port: process.env.REDIS_PORT,
      tls: process.env.NODE_ENV === 'production' ? {} : undefined
    }
  },
  cookie: {
    cookieNameCookiePolicy: 'ffc_ahwr_cookie_policy',
    cookieNameAuth: 'ffc_ahwr_auth',
    cookieNameSession: 'ffc_ahwr_session',
    isSameSite: 'Lax',
    isSecure: process.env.NODE_ENV === 'production',
    password: process.env.COOKIE_PASSWORD
  },
  cookiePolicy: {
    clearInvalid: false,
    encoding: 'base64json',
    isSameSite: 'Lax',
    isSecure: process.env.NODE_ENV === 'production',
    password: process.env.COOKIE_PASSWORD
  },
  env: process.env.NODE_ENV,
  displayPageSize: process.env.DISPLAY_PAGE_SIZE,
  googleTagManagerKey: process.env.GOOGLE_TAG_MANAGER_KEY,
  isDev: process.env.NODE_ENV === 'development',
  applicationApiUri: process.env.APPLICATION_API_URI,
  port: process.env.PORT,
  serviceUri: process.env.SERVICE_URI,
  claimServiceUri: process.env.CLAIM_SERVICE_URI,
  applyServiceUri: process.env.APPLY_SERVICE_URI,
  useRedis: process.env.NODE_ENV !== 'test',
  ruralPaymentsAgency: {
    loginUri: 'https://www.ruralpayments.service.gov.uk',
    callChargesUri: 'https://www.gov.uk/call-charges',
    email: 'ruralpayments@defra.gov.uk',
    telephone: '03000 200 301'
  },
  customerSurvey: {
    uri: 'https://defragroup.eu.qualtrics.com/jfe/form/SV_4IsQyL0cOUbFDQG'
  },
  applicationApi: require('../api-requests/application-api.config'),
  dateOfTesting: {
    enabled: process.env.DATE_OF_TESTING_ENABLED
  },
  tenMonthRule: {
    enabled: process.env.TEN_MONTH_RULE_ENABLED
  },
  wreckHttp: {
    timeoutMilliseconds: process.env.WRECK_HTTP_TIMEOUT_MILLISECONDS
  },
  endemics: {
    enabled: process.env.ENDEMICS_ENABLED
  },
  multiSpecies: {
    enabled: process.env.MULTI_SPECIES_ENABLED === 'true',
    releaseDate: process.env.MULTI_SPECIES_RELEASE_DATE || '2024-12-06'
  },
  latestTermsAndConditionsUri: process.env.TERMS_AND_CONDITIONS_URL,
  reapplyTimeLimitMonths: 10
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The server config is invalid. ${result.error.message}`)
}

const value = result.value
value.mqConfig = mqConfig
value.authConfig = authConfig
value.storage = storageConfig

module.exports = value
