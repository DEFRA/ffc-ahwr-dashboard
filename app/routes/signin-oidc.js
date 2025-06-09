import joi from "joi";
import HttpStatus from "http-status-codes";
import { sessionKeys } from "../session/keys.js";
import { config } from "../config/index.js";
import appInsights from "applicationinsights";
import { requestAuthorizationCodeUrl } from "../auth/auth-code-grant/request-authorization-code-url.js";
import { generateNewCrumb } from "./utils/crumb-cache.js";
import { retrieveApimAccessToken } from "../auth/client-credential-grant/retrieve-apim-access-token.js";
import {
  getCustomer,
  getEndemicsClaim,
  setCustomer,
  setEndemicsClaim,
  setFarmerApplyData,
} from "../session/index.js";
import { authenticate } from "../auth/authenticate.js";
import { setAuthCookie } from "../auth/cookie-auth/cookie-auth.js";
import { farmerApply } from "../constants/constants.js";
import { LockedBusinessError } from "../exceptions/LockedBusinessError.js";
import { InvalidPermissionsError } from "../exceptions/InvalidPermissionsError.js";
import { InvalidStateError } from "../exceptions/InvalidStateError.js";
import { NoEligibleCphError } from "../exceptions/NoEligibleCphError.js";
import { NoEndemicsAgreementError } from "../exceptions/NoEndemicsAgreementError.js";
import { OutstandingAgreementError } from "../exceptions/OutstandingAgreementError.js";
import { raiseIneligibilityEvent } from "../event/raise-ineligibility-event.js";
import {
  getPersonName,
  getPersonSummary,
} from "../api-requests/rpa-api/person.js";
import {
  getOrganisationAddress,
  organisationIsEligible,
} from "../api-requests/rpa-api/organisation.js";
import { changeContactHistory } from "../api-requests/contact-history-api.js";
import { customerMustHaveAtLeastOneValidCph } from "../api-requests/rpa-api/cph-check.js";
import { getLatestApplicationsBySbi } from "../api-requests/application-api.js";
import { getRedirectPath } from "./utils/get-redirect-path.js";
import { ClaimHasExpiredError } from "../exceptions/ClaimHasExpired.js";
import { maybeSuffixLoginRedirectUrl } from "../lib/suffix-url.js";

function setOrganisationSessionData(request, personSummary, org, crn) {
  const organisation = {
    sbi: org.sbi?.toString(),
    farmerName: getPersonName(personSummary),
    name: org.name,
    orgEmail: org.email,
    email: personSummary.email ? personSummary.email : org.email,
    address: getOrganisationAddress(org.address),
    crn,
  };

  setEndemicsClaim(
    request,
    sessionKeys.endemicsClaim.organisation,
    organisation,
  );

  setFarmerApplyData(
    request,
    sessionKeys.farmerApplyData.organisation,
    organisation,
  );
}

const safelyGetLoginSource = (request) => {
  try {
    return JSON.parse(
      Buffer.from(request.query.state, "base64").toString("ascii"),
    ).source;
  } catch (queryStateError) {
    request.logger.setBindings({
      query: request.query,
      queryStateError,
    });
    return null;
  }
};

export const signinRouteHandlers = [
  {
    method: "GET",
    path: "/signin-oidc",
    options: {
      auth: false,
      validate: {
        query: joi
          .object({
            code: joi.string().required(),
            state: joi.string().required(),
          })
          .options({
            stripUnknown: true,
          }),
        failAction(request, h, err) {
          request.logger.setBindings({ err });
          appInsights.defaultClient.trackException({ exception: err });

          return h
            .view("verify-login-failed", {
              backLink: requestAuthorizationCodeUrl(
                request,
                safelyGetLoginSource(request),
              ),
              ruralPaymentsAgency: config.ruralPaymentsAgency,
            })
            .code(HttpStatus.BAD_REQUEST)
            .takeover();
        },
      },
      handler: async (request, h) => {
        try {
          await generateNewCrumb(request, h);
          const loginSource = safelyGetLoginSource(request);

          await authenticate(request);
          const apimAccessToken = await retrieveApimAccessToken(request);
          const personSummary = await getPersonSummary(
            request,
            apimAccessToken,
          );

          request.logger.setBindings({ personSummaryId: personSummary.id });

          setCustomer(request, sessionKeys.customer.id, personSummary.id);
          const { organisation, organisationPermission } =
            await organisationIsEligible(
              request,
              personSummary.id,
              apimAccessToken,
            );

          request.logger.setBindings({
            sbi: organisation.sbi,
          });

          await changeContactHistory(
            personSummary,
            organisation,
            request.logger,
          );

          const crn = getCustomer(request, sessionKeys.customer.crn);
          setOrganisationSessionData(request, personSummary, organisation, crn);

          setAuthCookie(request, personSummary.email, farmerApply);
          appInsights.defaultClient.trackEvent({
            name: "login",
            properties: {
              sbi: organisation.sbi,
              crn,
            },
          });

          if (organisation.locked) {
            throw new LockedBusinessError(
              `Organisation id ${organisation.id} is locked by RPA`,
            );
          }

          if (!organisationPermission) {
            throw new InvalidPermissionsError(
              `Person id ${personSummary.id} does not have the required permissions for organisation id ${organisation.id}`,
            );
          }

          await customerMustHaveAtLeastOneValidCph(request, apimAccessToken);

          const latestApplicationsForSbi = await getLatestApplicationsBySbi(
            organisation.sbi,
            request.logger,
          );
          let redirectPath = getRedirectPath(
            latestApplicationsForSbi,
            loginSource,
            organisation.sbi,
            request.query,
          );

          redirectPath = maybeSuffixLoginRedirectUrl(
            request,
            redirectPath,
            crn,
            personSummary.id,
          );

          return h.redirect(redirectPath);
        } catch (err) {
          request.logger.setBindings({ err });

          const loginSource = safelyGetLoginSource(request);

          const attachedToMultipleBusinesses = getCustomer(
            request,
            sessionKeys.customer.attachedToMultipleBusinesses,
          );
          const organisation = getEndemicsClaim(
            request,
            sessionKeys.endemicsClaim.organisation,
          );
          const crn = getCustomer(request, sessionKeys.customer.crn);

          switch (true) {
            case err instanceof InvalidStateError:
              return h.redirect(
                requestAuthorizationCodeUrl(request, loginSource),
              );
            case err instanceof InvalidPermissionsError:
            case err instanceof LockedBusinessError:
            case err instanceof NoEligibleCphError:
            case err instanceof OutstandingAgreementError:
            case err instanceof NoEndemicsAgreementError:
            case err instanceof ClaimHasExpiredError:
              break;
            default:
              appInsights.defaultClient.trackException({ exception: err });
              return h
                .view("verify-login-failed", {
                  backLink: requestAuthorizationCodeUrl(request, loginSource),
                  ruralPaymentsAgency: config.ruralPaymentsAgency,
                })
                .code(HttpStatus.BAD_REQUEST)
                .takeover();
          }

          try {
            await raiseIneligibilityEvent(
              request.yar.id,
              organisation.sbi,
              crn,
              organisation.email,
              err.name,
            );
          } catch (ineligibilityEventError) {
            request.logger.setBindings({ ineligibilityEventError });
          }

          return h
            .view("cannot-apply-exception", {
              error: err,
              ruralPaymentsAgency: config.ruralPaymentsAgency,
              hasMultipleBusinesses: attachedToMultipleBusinesses,
              backLink: requestAuthorizationCodeUrl(request, loginSource),
              claimLink: `${config.claimServiceUri}/endemics/`,
              applyLink: `${config.applyServiceUri}/endemics/start`,
              sbiText: `SBI ${organisation.sbi ?? ""}`,
              organisationName: organisation.name,
              guidanceLink: config.serviceUri,
            })
            .code(HttpStatus.BAD_REQUEST)
            .takeover();
        }
      },
    },
  },
];
