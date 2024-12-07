const auth = require('../auth')
const session = require('../session')
const sessionKeys = require('../session/keys')
const { vetVisits, claimServiceUri } = require('../config/routes')
const { latestTermsAndConditionsUri, multiSpecies } = require('../config')
const { getLatestApplicationsBySbi } = require('../api-requests/application-api')
const { getClaimsByApplicationReference, isWithinLastTenMonths } = require('../api-requests/claim-api')
const { claimType } = require('../constants/claim')
const { statusIdToFrontendStatusMapping, statusClass } = require('../constants/status')
const { checkReviewIsPaidOrReadyToPay } = require('./utils/checks')
const applicationType = require('../constants/application-type')
const { userNeedsNotification } = require('./utils/user-needs-notification')

const pageUrl = `/${vetVisits}`
const claimServiceRedirectUri = `${claimServiceUri}/endemics?from=dashboard`

module.exports = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const MAXIMUM_CLAIMS_TO_DISPLAY = 6
      const { organisation } = session.getEndemicsClaim(request)

      request.logger.setBindings({ sbi: organisation.sbi })

      const { attachedToMultipleBusinesses } = session.getCustomer(request)
      const applications = await getLatestApplicationsBySbi(organisation.sbi, request.logger)
      const vetVisitApplications = applications?.filter((application) => application.type === applicationType.VET_VISITS)
      const latestEndemicsApplication = applications?.find((application) => application.type === applicationType.ENDEMICS)

      const sortByCreatedAt = (claims) => claims?.sort((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b)
      const typeOfReviewTitle = (typeOfReview) => [claimType.review, applicationType.VET_VISITS].includes(typeOfReview) ? 'review' : 'follow-up'
      const statusTag = (claim) => `<strong class="govuk-tag ${statusClass[statusIdToFrontendStatusMapping[claim.statusId]]?.styleClass || 'govuk-tag--grey'}">${statusIdToFrontendStatusMapping[claim.statusId]}</strong>`
      const description = (claim) => `${claim.reference} - ${claim.data?.typeOfLivestock ? claim.data?.typeOfLivestock : claim.data?.whichReview} ${typeOfReviewTitle(claim.type)}`

      const claims = latestEndemicsApplication ? await getClaimsByApplicationReference(latestEndemicsApplication?.reference, request.logger) : []
      const vetVisitApplicationsWithinLastTenMonths = vetVisitApplications.filter((application) => isWithinLastTenMonths(application?.data?.visitDate))
      const allClaims = [...(claims && sortByCreatedAt(claims)), ...(vetVisitApplicationsWithinLastTenMonths && sortByCreatedAt(vetVisitApplicationsWithinLastTenMonths))]
      const claimsToDisplay = allClaims.slice(0, MAXIMUM_CLAIMS_TO_DISPLAY).map(claim => ([{ text: description(claim) }, { html: statusTag(claim) }]))

      session.setEndemicsClaim(request, sessionKeys.endemicsClaim.LatestEndemicsApplicationReference, latestEndemicsApplication?.reference)
      const downloadedDocument = `/download-application/${organisation.sbi}/${latestEndemicsApplication?.reference}`

      const showNotificationBanner =
        multiSpecies.enabled &&
        latestEndemicsApplication &&
        userNeedsNotification(applications, claims)

      return h.view(vetVisits, {
        claims: claimsToDisplay,
        showNotificationBanner,
        checkReviewIsPaidOrReadyToPay: checkReviewIsPaidOrReadyToPay(allClaims),
        hasMultipleBusinesses: attachedToMultipleBusinesses,
        claimServiceRedirectUri: `${claimServiceRedirectUri}&sbi=${organisation.sbi}`,
        ...organisation,
        ...(latestEndemicsApplication?.reference && { reference: latestEndemicsApplication?.reference }),
        ...(latestEndemicsApplication?.reference && { downloadedDocument }),
        ...(attachedToMultipleBusinesses && { hostname: auth.requestAuthorizationCodeUrl(session, request) }),
        latestTermsAndConditionsUri
      })
    }
  }
}
