const routes = [].concat(
  require('../routes/accessibility'),
  require('../routes/assets'),
  require('../routes/cookies'),
  require('../routes/healthy'),
  require('../routes/healthz'),
  require('../routes/index'),
  require('../routes/check-details'),
  require('../routes/update-details'),
  require('../routes/privacy-policy'),
  require('../routes/terms-and-conditions'),
  require('../routes/view-application'),
  require('../routes/view-all'),
  require('../routes/signin-oidc'),
  require('../routes/vet-visits')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, _) => {
      server.route(routes)
    }
  }
}
