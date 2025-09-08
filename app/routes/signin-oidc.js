import joi from "joi";
import { StatusCodes } from "http-status-codes";
import { sessionKeys } from "../session/keys.js";
import appInsights from "applicationinsights";
import { requestAuthorizationCodeUrl } from "../auth/auth-code-grant/request-authorization-code-url.js";
import { generateNewCrumb } from "./utils/crumb-cache.js";
import { retrieveApimAccessToken } from "../auth/client-credential-grant/retrieve-apim-access-token.js";
import { getCustomer } from "../session/index.js";
import { authenticate } from "../auth/authenticate.js";
import { setAuthCookie } from "../auth/cookie-auth/cookie-auth.js";
import { farmerApply } from "../constants/constants.js";
import { updateContactHistory } from "../api-requests/contact-history-api.js";
import { RPA_CONTACT_DETAILS } from 'ffc-ahwr-common-library'
import { checkLoginValid } from "./utils/check-login-valid.js";
import { getPersonAndOrg } from "../api-requests/rpa-api/get-person-and-org.js";

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
              ruralPaymentsAgency: RPA_CONTACT_DETAILS,
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

          const { accessToken, authRedirectCallback } = await authenticate(request, loginSource, h, logger);

          if (authRedirectCallback) {
            return authRedirectCallback;
          }

          const apimAccessToken = await retrieveApimAccessToken(request);

          const crn = getCustomer(request, sessionKeys.customer.crn);

          const { orgDetails, personSummary } = await getPersonAndOrg({ request, apimAccessToken, crn, logger, accessToken })

          await updateContactHistory(personSummary, orgDetails.organisation, logger);

          setAuthCookie(request, personSummary.email, farmerApply);

          const { redirectPath, redirectCallback } = await checkLoginValid({
            h,
            organisation: orgDetails.organisation,
            organisationPermission: orgDetails.organisationPermission,
            request,
            apimAccessToken,
            personSummary,
            loginSource,
          });

          if (redirectCallback) {
            return redirectCallback;
          }

          appInsights.defaultClient.trackEvent({
            name: "successful-login",
            properties: {
              sbi: orgDetails.organisation.sbi,
              crn,
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
