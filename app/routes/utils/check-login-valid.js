import { StatusCodes } from "http-status-codes";
import { customerHasAtLeastOneValidCph } from "../../api-requests/rpa-api/cph-check";
import { requestAuthorizationCodeUrl } from "../../auth/auth-code-grant/request-authorization-code-url";
import { config } from "../../config";
import { raiseIneligibilityEvent } from "../../event/raise-ineligibility-event";
import { getCustomer } from "../../session";
import { sessionKeys } from "../../session/keys";

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

  if (error) {
    await raiseIneligibilityEvent(
      request.yar.id,
      organisation.sbi,
      crn,
      organisation.email,
      error
    );

    const hasMultipleBusinesses = Boolean(
      getCustomer(request, sessionKeys.customer.attachedToMultipleBusinesses)
    );

    return h
      .view("cannot-apply-exception", {
        error,
        ruralPaymentsAgency: config.ruralPaymentsAgency,
        hasMultipleBusinesses,
        backLink: requestAuthorizationCodeUrl(request, loginSource),
        claimLink: `${config.claimServiceUri}/endemics/`,
        applyLink: `${config.applyServiceUri}/endemics/start`,
        sbiText: `SBI ${organisation.sbi ?? ""}`,
        organisationName: organisation.name,
        guidanceLink: config.serviceUri,
      })
      .code(StatusCodes.BAD_REQUEST)
      .takeover();
  }

};
