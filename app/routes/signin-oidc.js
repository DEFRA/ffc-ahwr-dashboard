import joi from "joi";
import { StatusCodes } from "http-status-codes";
import { sessionKeys } from "../session/keys.js";
import appInsights from "applicationinsights";
import { requestAuthorizationCodeUrl } from "../auth/auth-code-grant/request-authorization-code-url.js";
import { generateNewCrumb } from "./utils/crumb-cache.js";
import { retrieveApimAccessToken } from "../auth/client-credential-grant/retrieve-apim-access-token.js";
import {
  getCustomer,
  setCustomer,
  setEndemicsClaim,
  setFarmerApplyData,
} from "../session/index.js";
import { authenticate } from "../auth/authenticate.js";
import { setAuthCookie } from "../auth/cookie-auth/cookie-auth.js";
import { farmerApply } from "../constants/constants.js";
import { getPersonSummary } from "../api-requests/rpa-api/person.js";
import { organisationIsEligible } from "../api-requests/rpa-api/organisation.js";
import { updateContactHistory } from "../api-requests/contact-history-api.js";
import { getLatestApplicationsBySbi } from "../api-requests/application-api.js";
import { getRedirectPath } from "./utils/get-redirect-path.js";
import { maybeSuffixLoginRedirectUrl } from "../lib/suffix-url.js";
import { RPA_CONTACT_DETAILS } from 'ffc-ahwr-common-library'
import { checkLoginValid } from "./utils/check-login-valid.js";

const setOrganisationSessionData = (request, personSummary, org, crn) => {
  const organisation = {
    sbi: org.sbi?.toString(),
    farmerName: personSummary.name,
    name: org.name,
    orgEmail: org.email,
    email: personSummary.email ?? org.email,
    address: org.address,
    crn,
  };

  setEndemicsClaim(request, sessionKeys.endemicsClaim.organisation, organisation);

  setFarmerApplyData(request, sessionKeys.farmerApplyData.organisation, organisation);
}

const safelyGetLoginSource = (request) => {
  try {
    return JSON.parse(Buffer.from(request.query.state, "base64").toString("ascii")).source;
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
              backLink: requestAuthorizationCodeUrl(request, safelyGetLoginSource(request)),
              ruralPaymentsAgency: {
                email: RPA_CONTACT_DETAILS
              },
            })
            .code(StatusCodes.BAD_REQUEST)
            .takeover();
        },
      },
      handler: async (request, h) => {
        try {
          const { logger } = request;
          await generateNewCrumb(request, h);

          const loginSource = safelyGetLoginSource(request);

          await authenticate(request, loginSource, h, logger);

          const apimAccessToken = await retrieveApimAccessToken(request);

          const crn = getCustomer(request, sessionKeys.customer.crn);

          const personSummary = await getPersonSummary(
            request,
            apimAccessToken,
            crn,
            logger
          );

          setCustomer(request, sessionKeys.customer.id, personSummary.id);

          const { organisation, organisationPermission } =
            await organisationIsEligible(
              request,
              personSummary.id,
              apimAccessToken
            );

          await updateContactHistory(personSummary, organisation, logger);

          setOrganisationSessionData(request, personSummary, organisation, crn);
          setAuthCookie(request, personSummary.email, farmerApply);

          await checkLoginValid({
            h,
            organisation,
            organisationPermission,
            request,
            apimAccessToken,
            personSummary,
            loginSource,
          });

          const latestApplicationsForSbi = await getLatestApplicationsBySbi(
            organisation.sbi,
            logger
          );

          const initialRedirectPath = getRedirectPath(latestApplicationsForSbi);
          const redirectPath = maybeSuffixLoginRedirectUrl(
            request,
            initialRedirectPath,
            crn,
            personSummary.id
          );

          appInsights.defaultClient.trackEvent({
            name: "successful-login",
            properties: {
              sbi: organisation.sbi,
              crn,
              redirectTo: initialRedirectPath,
            },
          });

          return h.redirect(redirectPath);
        } catch (err) {
          request.logger.setBindings({ err });
          const loginSource = safelyGetLoginSource(request);
          appInsights.defaultClient.trackException({ exception: err });

          return h
            .view("verify-login-failed", {
              backLink: requestAuthorizationCodeUrl(request, loginSource),
              ruralPaymentsAgency: RPA_CONTACT_DETAILS,
            })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
            .takeover();
        }
      },
    },
  },
];
