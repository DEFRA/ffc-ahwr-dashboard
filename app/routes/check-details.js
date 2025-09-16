import { getOrganisationModel } from "./models/organisation.js";
import { sessionKeys } from "../session/keys.js";
import boom from "@hapi/boom";
import joi from "joi";
import HttpStatus from "http-status-codes";
import { getEndemicsClaim, getSignInRedirect, setEndemicsClaim } from "../session/index.js";
import { RPA_CONTACT_DETAILS } from "ffc-ahwr-common-library";
import { applyServiceUri } from "../config/routes.js";

const {
  organisation: organisationKey,
  confirmCheckDetails: confirmCheckDetailsKey,
} = sessionKeys.endemicsClaim;

export const checkDetailsHandlers = [
  {
    method: "GET",
    path: "/check-details",
    options: {
      handler: async (request, h) => {
        const organisation = getEndemicsClaim(request, organisationKey);

        if (!organisation) {
          return boom.notFound();
        }

        return h.view("check-details", getOrganisationModel(request, organisation));
      },
    },
  },
  {
    method: "POST",
    path: "/check-details",
    options: {
      validate: {
        payload: joi.object({
          confirmCheckDetails: joi.string().valid("yes", "no").required(),
        }),
        failAction: (request, h, err) => {
          request.logger.setBindings({ err });
          const organisation = getEndemicsClaim(request, organisationKey);
          if (!organisation) {
            return boom.notFound();
          }
          return h
            .view("check-details", {
              errorMessage: { text: "Select if these details are correct" },
              ...getOrganisationModel(
                request,
                organisation,
                "Select if these details are correct",
              ),
            })
            .code(HttpStatus.BAD_REQUEST)
            .takeover();
        },
      },
      handler: async (request, h) => {
        const { confirmCheckDetails } = request.payload;
        setEndemicsClaim(request, confirmCheckDetailsKey, confirmCheckDetails);

        if (confirmCheckDetails === "yes") {
          const redirectToApply = getSignInRedirect(request, sessionKeys.signInRedirect);

          if (redirectToApply === true) {
            console.log(`${applyServiceUri}/endemics/you-can-claim-multiple`);
            return h.redirect(`${applyServiceUri}/endemics/you-can-claim-multiple`);
          }

          return h.redirect("/vet-visits");
        }

        return h.view("update-details", { ruralPaymentsAgency: RPA_CONTACT_DETAILS });
      },
    },
  },
];
