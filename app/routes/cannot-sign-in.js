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
          payload: joi.string().required(),
        }).unknown(true),
      },
      handler: async (request, h) => {
        const { payload } = request.query;
        const decodedPayload = JSON.parse(Buffer.from(payload, "base64").toString("ascii"));
        const { error, hasMultipleBusinesses, backLink, organisation } = decodedPayload;

        if ([error, hasMultipleBusinesses, backLink, organisation].includes(undefined)) {
          throw new Error('Page doesnt have required data to render.');
        }

        const token = getToken(request, sessionKeys.tokens.accessToken);
        const signOutLink = getSignOutUrl(token);

        return h
          .view("cannot-sign-in-exception", {
            error,
            ruralPaymentsAgency: RPA_CONTACT_DETAILS,
            hasMultipleBusinesses: hasMultipleBusinesses === 'true',
            backLink,
            sbiText: `SBI ${organisation.sbi ?? ""}`,
            organisationName: organisation.name,
            signOutLink
          });
      },
    },
  },
];
