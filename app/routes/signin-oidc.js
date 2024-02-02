const Joi = require('joi')
const session = require('../session')
const auth = require('../auth')
const sessionKeys = require('../session/keys')
const config = require('../config')
const { farmerApply } = require('../constants/user-types')
const { getPersonSummary, getPersonName, organisationIsEligible, getOrganisationAddress, cphCheck } = require('../api-requests/rpa-api')
const { InvalidPermissionsError } = require('../exceptions')
const appInsights = require('applicationinsights')

function setOrganisationSessionData (request, personSummary, organisationSummary) {
  const organisation = {
    sbi: organisationSummary.organisation.sbi?.toString(),
    farmerName: getPersonName(personSummary),
    name: organisationSummary.organisation.name,
    email: personSummary.email ? personSummary.email : organisationSummary.organisation.email,
    address: getOrganisationAddress(organisationSummary.organisation.address)
  }
  session.setClaimData(
    request,
    sessionKeys.claimData.organisation,
    organisation
  )
}

module.exports = [{
  method: 'GET',
  path: '/signin-oidc',
  options: {
    auth: false,
    validate: {
      query: Joi.object({
        code: Joi.string().required(),
        state: Joi.string().required()
      }).options({
        stripUnknown: true
      }),
      failAction (request, h, err) {
        console.log(`Validation error caught during DEFRA ID redirect - ${err.message}.`)
        appInsights.defaultClient.trackException({ exception: err })
        return h.view('verify-login-failed', {
          backLink: auth.requestAuthorizationCodeUrl(session, request),
          ruralPaymentsAgency: config.ruralPaymentsAgency
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      try {
        await auth.authenticate(request, session)

        const apimAccessToken = await auth.retrieveApimAccessToken()
        const personSummary = await getPersonSummary(request, apimAccessToken)
        session.setCustomer(request, sessionKeys.customer.id, personSummary.id)
        const organisationSummary = await organisationIsEligible(request, personSummary.id, apimAccessToken)
        setOrganisationSessionData(request, personSummary, organisationSummary)

        if (!organisationSummary.organisationPermission) {
          throw new InvalidPermissionsError(`Person id ${personSummary.id} does not have the required permissions for organisation id ${organisationSummary.organisation.id}`)
        }

        await cphCheck.customerMustHaveAtLeastOneValidCph(request, apimAccessToken)

        auth.setAuthCookie(request, personSummary.email, farmerApply)
        appInsights.defaultClient.trackEvent({
          name: 'login',
          properties: {
            sbi: organisationSummary.organisation.sbi,
            crn: session.getCustomer(request, sessionKeys.customer.crn),
            email: personSummary.email
          }
        })

        return h.redirect('/check-details')
      } catch (err) {
        console.error(`Received error with name ${err.name} and message ${err.message}.`)

        return h.view('verify-login-failed', {
          backLink: auth.requestAuthorizationCodeUrl(session, request),
          ruralPaymentsAgency: config.ruralPaymentsAgency
        }).code(400).takeover()
      }
    }
  }
}
]
