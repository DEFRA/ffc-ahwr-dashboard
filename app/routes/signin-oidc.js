const Joi = require('joi')
const crumbCache = require('./utils/crumb-cache')
const session = require('../session')
const auth = require('../auth')
const sessionKeys = require('../session/keys')
const config = require('../config')
const { getPersonSummary, getPersonName, organisationIsEligible, getOrganisationAddress, cphCheck } = require('../api-requests/rpa-api')
const applicationApi = require('../api-requests/application-api')
const { farmerApply } = require('../constants/user-types')
const { status, closedStatuses } = require('../constants/status')
const applicationType = require('../constants/application-type')
const loginSources = require('../constants/login-sources')
const { InvalidPermissionsError, NoEndemicsAgreementError, NoEligibleCphError, InvalidStateError, OutstandingAgreementError, LockedBusinessError } = require('../exceptions')
const { raiseIneligibilityEvent } = require('../event')
const appInsights = require('applicationinsights')
const HttpStatus = require('http-status-codes')
const { changeContactHistory } = require('../api-requests/contact-history-api')

function setOrganisationSessionData (request, personSummary, org) {
  const organisation = {
    sbi: org.sbi?.toString(),
    farmerName: getPersonName(personSummary),
    name: org.name,
    orgEmail: org.email,
    email: personSummary.email ? personSummary.email : org.email,
    address: getOrganisationAddress(org.address)
  }

  session.setEndemicsClaim(
    request,
    sessionKeys.endemicsClaim.organisation,
    organisation
  )

  session.setFarmerApplyData(
    request,
    sessionKeys.farmerApplyData.organisation,
    organisation
  )
}
function sendToApplyJourney (latestApplicationsForSbi, loginSource, h, endemicsApplyJourney, organisation) {
  if (latestApplicationsForSbi.length === 0) {
    if (loginSource === loginSources.apply) {
      // send to endemics apply journey
      return endemicsApplyJourney
    } else {
      // show the 'You need to complete an endemics application' error page
      throw new NoEndemicsAgreementError(`Business with SBI ${organisation.sbi} must complete an endemics agreement`)
    }
  }

  const latestApplication = latestApplicationsForSbi[0]
  if (latestApplication.type === applicationType.ENDEMICS) {
    if (latestApplication.statusId === status.AGREED) {
      return '/check-details'
    } else {
      // send to endemics apply journey
      return endemicsApplyJourney
    }
  }

  if (closedStatuses.includes(latestApplication.statusId)) {
    if (loginSource === loginSources.apply) {
      // send to endemics apply journey
      return endemicsApplyJourney
    } else {
      // show the 'You need to complete an endemics application' error page
      throw new NoEndemicsAgreementError(`Business with SBI ${organisation.sbi} must complete an endemics agreement`)
    }
  }
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
        request.logger.setBindings({ err })
        appInsights.defaultClient.trackException({ exception: err })
        const loginSource = request?.query?.state ? JSON.parse(Buffer.from(request.query.state, 'base64').toString('ascii')).source : undefined

        return h.view('verify-login-failed', {
          backLink: auth.requestAuthorizationCodeUrl(session, request, loginSource),
          ruralPaymentsAgency: config.ruralPaymentsAgency
        }).code(HttpStatus.StatusCodes.BAD_REQUEST).takeover()
      }
    },
    handler: async (request, h) => {
      try {
        await crumbCache.generateNewCrumb(request, h)
        const loginSource = JSON.parse(Buffer.from(request.query.state, 'base64').toString('ascii')).source

        await auth.authenticate(request)
        const apimAccessToken = await auth.retrieveApimAccessToken(request)
        const personSummary = await getPersonSummary(request, apimAccessToken)

        request.logger.setBindings({ personSummaryId: personSummary.id })

        session.setCustomer(request, sessionKeys.customer.id, personSummary.id)
        const { organisation, organisationPermission } = await organisationIsEligible(request, personSummary.id, apimAccessToken)

        request.logger.setBindings({
          sbi: organisation.sbi
        })

        await changeContactHistory(personSummary, organisation, request.logger)
        setOrganisationSessionData(request, personSummary, organisation)

        auth.setAuthCookie(request, personSummary.email, farmerApply)
        appInsights.defaultClient.trackEvent({
          name: 'login',
          properties: {
            sbi: organisation.sbi,
            crn: session.getCustomer(request, sessionKeys.customer.crn),
            email: personSummary.email
          }
        })

        if (organisation.locked) {
          throw new LockedBusinessError(`Organisation id ${organisation.id} is locked by RPA`)
        }

        if (!organisationPermission) {
          throw new InvalidPermissionsError(`Person id ${personSummary.id} does not have the required permissions for organisation id ${organisation.id}`)
        }

        await cphCheck.customerMustHaveAtLeastOneValidCph(request, apimAccessToken)

        const endemicsApplyJourney = `${config.applyServiceUri}/endemics/check-details`
        const oldClaimJourney = `${config.claimServiceUri}/signin-oidc?state=${request.query.state}&code=${request.query.code}`
        const latestApplicationsForSbi = await applicationApi.getLatestApplicationsBySbi(organisation.sbi, request.logger)
        const applyRedirectionLink = sendToApplyJourney(latestApplicationsForSbi, loginSource, h, endemicsApplyJourney, organisation)

        if (typeof applyRedirectionLink === 'string') {
          return h.redirect(applyRedirectionLink)
        }

        // they have an open old world application/claim
        if (loginSource === loginSources.apply) {
          // show the 'You have an outstanding claim' error page
          throw new OutstandingAgreementError(`Business with SBI ${organisation.sbi} must claim or withdraw agreement before creating another`)
        } else {
          // send to old claim journey
          return h.redirect(oldClaimJourney)
        }
      } catch (err) {
        request.logger.setBindings({ err })

        const loginSource = JSON.parse(Buffer.from(request.query.state, 'base64').toString('ascii')).source
        const attachedToMultipleBusinesses = session.getCustomer(request, sessionKeys.customer.attachedToMultipleBusinesses)
        const organisation = session.getEndemicsClaim(request, sessionKeys.endemicsClaim.organisation)
        const crn = session.getCustomer(request, sessionKeys.customer.crn)

        switch (true) {
          case err instanceof InvalidStateError:
            return h.redirect(auth.requestAuthorizationCodeUrl(session, request, loginSource))
          case err instanceof InvalidPermissionsError:
            break
          case err instanceof LockedBusinessError:
            break
          case err instanceof NoEligibleCphError:
            break
          case err instanceof OutstandingAgreementError:
            break
          case err instanceof NoEndemicsAgreementError:
            break
          default:
            appInsights.defaultClient.trackException({ exception: err })
            return h.view('verify-login-failed', {
              backLink: auth.requestAuthorizationCodeUrl(session, request, loginSource),
              ruralPaymentsAgency: config.ruralPaymentsAgency
            }).code(HttpStatus.StatusCodes.BAD_REQUEST).takeover()
        }

        try {
          await raiseIneligibilityEvent(
            request.yar.id,
            organisation?.sbi,
            crn,
            organisation?.email,
            err.name
          )
        } catch (err) {
          request.logger.setBindings({ err })
        }

        return h.view('cannot-apply-exception', {
          ruralPaymentsAgency: config.ruralPaymentsAgency,
          permissionError: err instanceof InvalidPermissionsError,
          cphError: err instanceof NoEligibleCphError,
          lockedBusinessError: err instanceof LockedBusinessError,
          outstandingAgreementError: err instanceof OutstandingAgreementError,
          noEndemicsAgreementError: err instanceof NoEndemicsAgreementError,
          hasMultipleBusinesses: attachedToMultipleBusinesses,
          backLink: auth.requestAuthorizationCodeUrl(session, request, loginSource),
          claimLink: `${config.claimServiceUri}/endemics/`,
          applyLink: `${config.applyServiceUri}/endemics/start`,
          sbiText: `SBI ${organisation?.sbi ?? ''}`,
          organisationName: organisation?.name,
          guidanceLink: config.serviceUri
        }).code(HttpStatus.StatusCodes.BAD_REQUEST).takeover()
      }
    }
  }
}
]
