const config = require('./config')
const Hapi = require('@hapi/hapi')
const catbox = config.useRedis
  ? require('@hapi/catbox-redis')
  : require('@hapi/catbox-memory')
const cacheConfig = config.useRedis ? config.cache.options : {}

const getSecurityPolicy = () => "default-src 'self';" +
"object-src 'none';" +
"script-src 'self' www.google-analytics.com *.googletagmanager.com ajax.googleapis.com *.googletagmanager.com/gtm.js 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes';" +
"form-action 'self';" +
"base-uri 'self';" +
"connect-src 'self' *.google-analytics.com *.analytics.google.com *.googletagmanager.com" +
"style-src 'self' 'unsafe-inline' tagmanager.google.com *.googleapis.com;" +
"img-src 'self' *.google-analytics.com *.googletagmanager.com;"

async function createServer () {
  const server = Hapi.server({
    cache: [{
      provider: {
        constructor: catbox,
        options: cacheConfig
      }
    }],
    port: config.port,
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      }
    },
    router: {
      stripTrailingSlash: true
    }
  })

  await server.register(require('./plugins/crumb'))
  await server.register(require('@hapi/cookie'))
  await server.register(require('@hapi/inert'))
  await server.register(require('./plugins/auth-plugin'))
  await server.register(require('./plugins/cookies'))
  await server.register(require('./plugins/error-pages'))
  await server.register(require('./plugins/logger'))
  await server.register(require('./plugins/router'))
  await server.register(require('./plugins/session'))
  await server.register(require('./plugins/view-context'))
  await server.register(require('./plugins/views'))
  await server.register({
    plugin: require('./plugins/header'),
    options: {
      keys: [
        { key: 'X-Frame-Options', value: 'deny' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Access-Control-Allow-Origin', value: config.serviceUri },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000;' },
        { key: 'Cache-Control', value: 'no-cache' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'Permissions-Policy', value: 'Interest-Cohort=()' },
        {
          key: 'Content-Security-Policy',
          value: getSecurityPolicy()
        }
      ]
    }
  })

  return server
}

module.exports = createServer
