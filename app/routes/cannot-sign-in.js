import joi from "joi";
import { RPA_CONTACT_DETAILS } from "ffc-ahwr-common-library";
import { getSignOutUrl } from "./sign-out.js";
import { getToken } from "../session/index.js";
import { sessionKeys } from "../session/keys.js";

export const cannotSignInExceptionHandlers = [
  {
    method: "GET",
    path: "/cannot-sign-in",
    options: {
      auth: false,
      plugins: {
        crumb: false,
      },
      validate: {
        query: joi.object({
          error: joi.string().required(),
          hasMultipleBusinesses: joi.string().required(),
          backLink: joi.string().required(),
          organisation: joi.string().required()
        }).unknown(true),
      },
      handler: async (request, h) => {

        const { error, hasMultipleBusinesses: hasMultipleBusinessesString, backLink, organisation } = request.query;

        const token = getToken(request, sessionKeys.tokens.accessToken);
        const signOutLink = getSignOutUrl(token);

        return h
          .view("cannot-sign-in-exception", {
            error,
            ruralPaymentsAgency: RPA_CONTACT_DETAILS,
            hasMultipleBusinesses: hasMultipleBusinessesString === 'true',
            backLink,
            sbiText: `SBI ${organisation.sbi ?? ""}`,
            organisationName: organisation.name,
            signOutLink
          });
      },
    },
  },
];
