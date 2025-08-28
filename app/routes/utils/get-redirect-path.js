import { config } from "../../config/index.js";
import { applicationType } from "../../constants/constants.js";
import { CLAIM_STATUS } from "ffc-ahwr-common-library";

const closedViewStatuses = [
  CLAIM_STATUS.WITHDRAWN,
  CLAIM_STATUS.REJECTED,
  CLAIM_STATUS.NOT_AGREED,
  CLAIM_STATUS.READY_TO_PAY,
];

export function getRedirectPath(latestApplicationsForSbi) {
  const endemicsApplyJourney = `${config.applyServiceUri}/endemics/check-details`;
  const dashboardEntry = `/check-details`;

  if (latestApplicationsForSbi.length === 0) {
    // send to endemics apply journey, regardless of where user signed in
    return endemicsApplyJourney;
  }

  const latestApplication = latestApplicationsForSbi[0];

  if (latestApplication.type === applicationType.ENDEMICS) {
    if (latestApplication.statusId === CLAIM_STATUS.AGREED) {
      return dashboardEntry;
    }

    return endemicsApplyJourney;
  }

  if (closedViewStatuses.includes(latestApplication.statusId)) {
    // User has claimed on their OW agreement, and needs a new world agreement.
    // Send to endemics apply journey, regardless of where user signed in
    return endemicsApplyJourney;
  }

  // error?
}
