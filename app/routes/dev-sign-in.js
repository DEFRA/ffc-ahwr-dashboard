import { config } from "../config/index.js";
import { LockedBusinessError } from "../exceptions/LockedBusinessError.js";
import { InvalidPermissionsError } from "../exceptions/InvalidPermissionsError.js";
import { NoEligibleCphError } from "../exceptions/NoEligibleCphError.js";
import { sessionKeys } from "../session/keys.js";
import {
  getCustomer,
  setCustomer,
  setEndemicsClaim,
  setFarmerApplyData,
} from "../session/index.js";
import { setAuthCookie } from "../auth/cookie-auth/cookie-auth.js";
import { farmerApply } from "../constants/constants.js";
import { getLatestApplicationsBySbi } from "../api-requests/application-api.js";
import { getRedirectPath } from "./utils/get-redirect-path.js";
import HttpStatus from "http-status-codes";
import { applyServiceUri, claimServiceUri } from "../config/routes.js";
import { requestAuthorizationCodeUrl } from "../auth/auth-code-grant/request-authorization-code-url.js";
import { RPA_CONTACT_DETAILS } from "ffc-ahwr-common-library";

const pageUrl = `/dev-sign-in`;
const claimServiceRedirectUri = `${claimServiceUri}/endemics/dev-sign-in`;
const applyServiceRedirectUri = `${applyServiceUri}/endemics/dev-sign-in`;

const createDevDetails = (sbi) => {
  const organisationSummary = {
    organisationPermission: {},
    organisation: {
      sbi,
      name: "madeUpCo",
      email: "org@company.com",
      frn: "1100918140",
      address: "Somewhere",
      businessReference: "1100918140",
    },
    name: "madeUpCo",
  };

  const personSummary = {
    email: "farmer@farm.com",
    customerReferenceNumber: "2054561445",
    name: "John Smith"
  };

  return [personSummary, organisationSummary];
};

function setOrganisationSessionData(request, personSummary, organisationSummary) {
  const { organisation: org } = organisationSummary

  const organisation = {
    sbi: org.sbi,
    farmerName: personSummary.name,
    name: org.name,
    email: personSummary.email,
    orgEmail: org.email,
    address: org.address,
    crn: personSummary.customerReferenceNumber,
    frn: org.businessReference,
  };

  setFarmerApplyData(request, sessionKeys.farmerApplyData.organisation, organisation);
  setEndemicsClaim(request, sessionKeys.endemicsClaim.organisation, organisation);
}

function throwErrorBasedOnSuffix(sbi = "") {
  if (sbi.toUpperCase().endsWith("L")) {
    throw new LockedBusinessError(`Organisation is locked by RPA`);
  } else if (sbi.toUpperCase().endsWith("I")) {
    throw new InvalidPermissionsError(
      `Person does not have the required permissions for organisation id`,
    );
  } else if (sbi.toUpperCase().endsWith("C")) {
    throw new NoEligibleCphError("Customer must have at least one valid CPH");
  }
}

export const devLoginHandlers = [
  {
    method: "GET",
    path: pageUrl,
    options: {
      auth: false,
      handler: async (request, h) => {
        const { sbi, cameFrom } = request.query;

        request.logger.info(`dev sign-in came from ${cameFrom}`);
        request.logger.setBindings({ sbi });

        const [personSummary, organisationSummary] = createDevDetails(sbi);

        try {
          throwErrorBasedOnSuffix(sbi);
          const latestApplicationsForSbi = await getLatestApplicationsBySbi(sbi, request.logger);

          setCustomer(request, sessionKeys.customer.id, personSummary.id);
          setCustomer(request, sessionKeys.customer.crn, personSummary.customerReferenceNumber);
          setOrganisationSessionData(request, personSummary, organisationSummary);
          setAuthCookie(request, personSummary.email, farmerApply);

          const { redirectPath, error } = getRedirectPath(latestApplicationsForSbi);

          if (error) {
            const errorToThrow = new Error();
            errorToThrow.name = error;

            throw errorToThrow;
          }

          return h.redirect(redirectPath);
        } catch (error) {
          const backLink = cameFrom === "apply" ? applyServiceRedirectUri : claimServiceRedirectUri;
          if (
            [
              "LockedBusinessError",
              "InvalidPermissionsError",
              "NoEligibleCphError",
              "ExpiredOldWorldApplication"
            ].includes(error.name)
          ) {
            return h
              .view("cannot-sign-in-exception", {
                error: error.name,
                ruralPaymentsAgency: RPA_CONTACT_DETAILS,
                hasMultipleBusinesses: getCustomer(
                  request,
                  sessionKeys.customer.attachedToMultipleBusinesses,
                ),
                backLink,
                claimLink: config.claimServiceUri,
                sbiText: `SBI ${sbi}`,
                organisationName: organisationSummary.name,
                guidanceLink: config.serviceUri,
              })
              .code(400)
              .takeover();
          }

          return h
            .view("verify-login-failed", {
              backLink,
              ruralPaymentsAgency: RPA_CONTACT_DETAILS,
              message: error.data?.payload?.message ?? error.message,
            })
            .code(HttpStatus.BAD_REQUEST)
            .takeover();
        }
      },
    },
  },
  {
    method: "GET",
    path: "/dev-defraid",
    options: {
      auth: false,
      handler: async (request, h) => {
        setFarmerApplyData(request, "sendBackDevValue", "true");
        return h.redirect(requestAuthorizationCodeUrl(request, "apply"));
      },
    },
  },
];
