import { customerHasAtLeastOneValidCph } from "../../api-requests/rpa-api/cph-check.js";
import { requestAuthorizationCodeUrl } from "../../auth/auth-code-grant/request-authorization-code-url.js";
import { raiseIneligibilityEvent } from "../../event/raise-ineligibility-event.js";
import { getCustomer, setCannotSignInDetails } from "../../session/index.js";
import { sessionKeys } from "../../session/keys.js";
import { getLatestApplicationsBySbi } from "../../api-requests/application-api.js";
import { getRedirectPath } from "./get-redirect-path.js";
import { maybeSuffixLoginRedirectUrl } from "../../lib/suffix-url.js";
import appInsights from "applicationinsights";

export const setSessionForErrorPage = ({ request, error, hasMultipleBusinesses, backLink, organisation }) => {
  setCannotSignInDetails(request, sessionKeys.cannotSignInDetails.error, error);
  setCannotSignInDetails(request, sessionKeys.cannotSignInDetails.hasMultipleBusinesses, hasMultipleBusinesses);
  setCannotSignInDetails(request, sessionKeys.cannotSignInDetails.backLink, backLink);
  setCannotSignInDetails(request, sessionKeys.cannotSignInDetails.organisation, organisation);
}

export const checkLoginValid = async ({ h, organisation, organisationPermission, request, cphNumbers, personSummary }) => {
  const { logger } = request;
  const crn = getCustomer(request, sessionKeys.customer.crn);

  if (organisation.locked) {
    const reason = `Organisation id ${organisation.id} is locked by RPA`;
    logger.setBindings({ error: reason, crn });

    appInsights.defaultClient.trackEvent({
      name: "unsuccessful-login",
      properties: {
        sbi: organisation.sbi,
        crn,
        reason
      },
    });

    return returnErrorRouting({ h, error: 'LockedBusinessError', organisation, request, crn });
  }
  
  if (!organisationPermission) {
    const reason = `Person id ${personSummary.id} does not have the required permissions for organisation id ${organisation.id}`;
    logger.setBindings({ error: reason, crn });

    appInsights.defaultClient.trackEvent({
      name: "unsuccessful-login",
      properties: {
        sbi: organisation.sbi,
        crn,
        reason
      },
    });

    return returnErrorRouting({ h, error: 'InvalidPermissionsError', organisation, request, crn });
  }

  const hasValidCph = await customerHasAtLeastOneValidCph(cphNumbers);

  if (!hasValidCph) {
    const reason = `Organisation id ${organisation.id} has no valid CPH's associated`;
    logger.setBindings({ error: reason, crn });

    appInsights.defaultClient.trackEvent({
      name: "unsuccessful-login",
      properties: {
        sbi: organisation.sbi,
        crn,
        reason
      },
    });

    return returnErrorRouting({ h, error: 'NoEligibleCphError', organisation, request, crn });
  }

  const latestApplicationsForSbi = await getLatestApplicationsBySbi(organisation.sbi, logger);
  const { redirectPath: initialRedirectPath, error: err } = getRedirectPath(latestApplicationsForSbi, request);

  if (err) {
    return returnErrorRouting({ h, error: err, organisation, request, crn });
  }

  const redirectPath = maybeSuffixLoginRedirectUrl(request, initialRedirectPath, crn, personSummary.id);

  return { redirectPath, redirectCallback: null };
};

const returnErrorRouting = async ({ h, error, organisation, request, crn }) => {
  await raiseIneligibilityEvent(request.yar.id, organisation.sbi, crn, organisation.email, error);

  const hasMultipleBusinesses = Boolean(getCustomer(request, sessionKeys.customer.attachedToMultipleBusinesses));

  setSessionForErrorPage({ request, error, hasMultipleBusinesses, backLink: requestAuthorizationCodeUrl(request), organisation });

  const redirectCallback = h.redirect('/cannot-sign-in').takeover();

  return { redirectPath: null, redirectCallback };
}
