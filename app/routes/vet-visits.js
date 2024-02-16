const { getEndemicsClaim } = require('../session')
const { vetVisits, claimServiceUri } = require('../config/routes')
const {
  getLatestApplicationsBySbi
} = require('../api-requests/application-api')

const pageUrl = `/${vetVisits}`
const claimServiceRedirectUri = `${claimServiceUri}/endemics?from=dashboard`

module.exports =
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { organisation } = getEndemicsClaim(request)
        const application = (
          await getLatestApplicationsBySbi(organisation.sbi)
        ).find((app) => {
          return app.type === 'EE'
        })

        return h.view(vetVisits, {
          claimServiceRedirectUri: `${claimServiceRedirectUri}&sbi=${organisation.sbi}`,
          ...organisation,
          ...(application?.reference && { reference: application?.reference })
        })
      }
    }
  }
