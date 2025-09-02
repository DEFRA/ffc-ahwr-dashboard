import { customerHasAtLeastOneValidCph } from "../../api-requests/rpa-api/cph-check.js";
import { requestAuthorizationCodeUrl } from "../../auth/auth-code-grant/request-authorization-code-url.js";
import { raiseIneligibilityEvent } from "../../event/raise-ineligibility-event.js";
import { getCustomer } from "../../session/index.js";
import { sessionKeys } from "../../session/keys.js";
import { getLatestApplicationsBySbi } from "../../api-requests/application-api.js";
import { getRedirectPath } from "./get-redirect-path.js";
import { maybeSuffixLoginRedirectUrl } from "../../lib/suffix-url.js";

const constructRedirectUri = (
 { 
  error,
  hasMultipleBusinesses,
  backLink,
  organisation
}
) => {
  const query = [
    `error=${error}`,
    `backLink=${backLink}`,
    `organisation=${organisation}`,
    `hasMultipleBusinesses=${hasMultipleBusinesses}`,
  ].join("&");

  return encodeURI(`/cannot-sign-in?${query}`);
};

export const checkLoginValid = async ({
  h,
  organisation,
  organisationPermission,
  request,
  apimAccessToken,
  personSummary,
  loginSource
}) => {

  const { logger } = request;
  const crn = getCustomer(request, sessionKeys.customer.crn);
  let error = "";

  if (organisation.locked) {
    logger.setBindings({ error: `Organisation id ${organisation.id} is locked by RPA`, crn })
    error = "LockedBusinessError";
  }

  if (!organisationPermission) {
    logger.setBindings({ error: `Person id ${personSummary.id} does not have the required permissions for organisation id ${organisation.id}`, crn })
    error = "InvalidPermissionsError";
  }

  const hasValidCph = await customerHasAtLeastOneValidCph(request, apimAccessToken);

  if (!hasValidCph) {
    logger.setBindings({ error: `Organisation id ${organisation.id} has no valid CPH's associated`, crn })
    error = "NoEligibleCphError";
  }

  // Checking if we already have an error, to avoid making this call if so
  if (!error) {
    const latestApplicationsForSbi = await getLatestApplicationsBySbi(organisation.sbi, logger);
    const { redirectPath: initialRedirectPath, error: err } = getRedirectPath(latestApplicationsForSbi);
    
    if (err) {
      error = err;
    } else {
      const redirectPath = maybeSuffixLoginRedirectUrl(request, initialRedirectPath, crn, personSummary.id);

      return { redirectPath, redirectCallback: null };
    }
  }

  await raiseIneligibilityEvent(request.yar.id, organisation.sbi, crn, organisation.email, error);

  const hasMultipleBusinesses = Boolean(getCustomer(request, sessionKeys.customer.attachedToMultipleBusinesses));

  const redirectCallbackUri = constructRedirectUri({ error, hasMultipleBusinesses, backLink: requestAuthorizationCodeUrl(request, loginSource), organisation });

  const redirectCallback = h.redirect(redirectCallbackUri).takeover();

  return { redirectPath: null, redirectCallback };
};
