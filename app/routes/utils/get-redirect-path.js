import { config } from "../../config/index.js";
import { CLAIM_STATUSES, closedViewStatuses } from "../../constants/claim-statuses.js";
import { applicationType } from "../../constants/constants.js";

export function getRedirectPath(latestApplicationsForSbi) {
  const endemicsApplyJourney = `${config.applyServiceUri}/endemics/check-details`;
  const dashboardEntry = `/check-details`;

  if (latestApplicationsForSbi.length === 0) {
    // send to endemics apply journey, regardless of where user signed in
    return { redirectPath: endemicsApplyJourney, error: '' };
  }

  const latestApplication = latestApplicationsForSbi[0];

  if (latestApplication.type === applicationType.ENDEMICS) {
    if (latestApplication.statusId === CLAIM_STATUSES.AGREED) {
      return { redirectPath: dashboardEntry, error: '' };
    }

    return { redirectPath: endemicsApplyJourney, error: '' };
  }

  if (closedViewStatuses.includes(latestApplication.statusId)) {
    // User has claimed on their OW agreement, and needs a new world agreement.
    // Send to endemics apply journey, regardless of where user signed in
    return { redirectPath: endemicsApplyJourney, error: '' };
  }

  return { redirectPath: '', error: 'ExpiredOldWorldApplication' }
}
