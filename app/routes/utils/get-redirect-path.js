import { CLAIM_STATUSES, closedViewStatuses } from "../../constants/claim-statuses.js";
import { applicationType } from "../../constants/constants.js";
import { setSignInRedirect } from "../../session/index.js";
import { sessionKeys } from "../../session/keys.js";
import appInsights from "applicationinsights";

export function getRedirectPath(latestApplicationsForSbi, request) {
  const checkDetails = "/check-details";

  if (latestApplicationsForSbi.length === 0) {
    setSignInRedirect(request, sessionKeys.signInRedirect, true);
    return { redirectPath: checkDetails, error: "" };
  }

  const latestApplication = latestApplicationsForSbi[0];

  if (latestApplication.type === applicationType.ENDEMICS) {
    if (latestApplication.statusId === CLAIM_STATUSES.AGREED) {
      return { redirectPath: checkDetails, error: "" };
    }

    setSignInRedirect(request, sessionKeys.signInRedirect, true);
    return { redirectPath: checkDetails, error: "" };
  }

  if (closedViewStatuses.includes(latestApplication.statusId)) {
    // User has claimed on their OW agreement, and needs a new world agreement.
    // Send to endemics apply journey
    setSignInRedirect(request, sessionKeys.signInRedirect, true);
    return { redirectPath: checkDetails, error: "" };
  }

  appInsights.defaultClient.trackEvent({
    name: "unsuccessful-login",
    properties: {
      sbi: latestApplication.data?.organisation?.sbi ?? "N/A",
      crn: latestApplication.data?.organisation?.crn ?? "N/A",
      reason: "User has an expired old world application"
    },
  });

  return { redirectPath: "", error: "ExpiredOldWorldApplication" };
}
