import { LockedBusinessError } from "../exceptions/LockedBusinessError.js";
import { InvalidPermissionsError } from "../exceptions/InvalidPermissionsError.js";
import { NoEligibleCphError } from "../exceptions/NoEligibleCphError.js";
import { sessionKeys } from "../session/keys.js";
import { setCustomer, setEndemicsClaim, setFarmerApplyData } from "../session/index.js";
import { setAuthCookie } from "../auth/cookie-auth/cookie-auth.js";
import { farmerApply } from "../constants/constants.js";
import { getLatestApplicationsBySbi } from "../api-requests/application-api.js";
import { getRedirectPath } from "./utils/get-redirect-path.js";
import HttpStatus from "http-status-codes";
import { requestAuthorizationCodeUrl } from "../auth/auth-code-grant/request-authorization-code-url.js";
import { RPA_CONTACT_DETAILS } from "ffc-ahwr-common-library";
import { setSessionForErrorPage } from "./utils/check-login-valid.js";

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

function throwErrorBasedOnSuffix(sbi = "") {
  if (sbi.toUpperCase().endsWith("L")) {
    throw new LockedBusinessError(`Organisation is locked by RPA`);
  } else if (sbi.toUpperCase().endsWith("I")) {
    throw new InvalidPermissionsError(
      `Person does not have the required permissions for organisation id`,
    );
  } else if (sbi.toUpperCase().endsWith("C")) {
    throw new NoEligibleCphError("Customer must have at least one valid CPH");
  } else {
    return '';
  }
}

export const devLoginHandlers = [
  {
    method: "GET",
    path: "/dev-sign-in",
    options: {
      auth: false,
      handler: async (request, h) => {
        const { sbi } = request.query;

        request.logger.setBindings({ sbi });

        const [personSummary, organisationSummary] = createDevDetails(sbi);
        const { organisation: org } = organisationSummary;

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

        try {
          throwErrorBasedOnSuffix(sbi);
          const latestApplicationsForSbi = await getLatestApplicationsBySbi(sbi, request.logger);

          setCustomer(request, sessionKeys.customer.id, personSummary.id);
          setCustomer(request, sessionKeys.customer.crn, personSummary.customerReferenceNumber);
          setFarmerApplyData(request, sessionKeys.farmerApplyData.organisation, organisation);
          setEndemicsClaim(request, sessionKeys.endemicsClaim.organisation, organisation);
          setAuthCookie(request, personSummary.email, farmerApply);

          const { redirectPath, error } = getRedirectPath(latestApplicationsForSbi);

          if (error) {
            const errorToThrow = new Error();
            errorToThrow.name = error;

            throw errorToThrow;
          }

          return h.redirect(redirectPath);
        } catch (error) {
          const errorNames = ["LockedBusinessError", "InvalidPermissionsError", "NoEligibleCphError", "ExpiredOldWorldApplication"];

          if (errorNames.includes(error.name)) {
            const hasMultipleBusinesses = sbi.charAt(0) === '1';
            const backLink = requestAuthorizationCodeUrl(request);
            setSessionForErrorPage({ request, error: error.name, hasMultipleBusinesses, backLink, organisation });

            return h.redirect('/cannot-sign-in').takeover();
          }

          return h
            .view("verify-login-failed", {
              backLink: "TODO",
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
        return h.redirect(requestAuthorizationCodeUrl(request));
      },
    },
  },
  {
    method: "GET",
    path: "/dev-landing-page",
    options: {
      auth: false,
      handler: async (request, h) => {
        return h.view("dev-landing-page");
      },
    },
  },
  {
    method: "POST",
    path: "/dev-landing-page",
    options: {
      auth: false,
      handler: async (request, h) => {
        const { sbi } = request.payload;

        return h.redirect(`/dev-sign-in?sbi=${sbi}`);
      }
    }
  }
];
