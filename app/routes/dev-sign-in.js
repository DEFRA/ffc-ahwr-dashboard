import { config } from "../config/index.js";
import { LockedBusinessError } from "../exceptions/LockedBusinessError.js";
import { InvalidPermissionsError } from "../exceptions/InvalidPermissionsError.js";
import { NoEligibleCphError } from "../exceptions/NoEligibleCphError.js";
import { OutstandingAgreementError } from "../exceptions/OutstandingAgreementError.js";
import { sessionKeys } from "../session/keys.js";
import { getPersonName } from "../api-requests/rpa-api/person.js";
import { getOrganisationAddress } from "../api-requests/rpa-api/organisation.js";
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
import { ClaimHasExpiredError } from "../exceptions/ClaimHasExpired.js";

const pageUrl = `/dev-sign-in`;
const claimServiceRedirectUri = `${claimServiceUri}/endemics/dev-sign-in`;
const applyServiceRedirectUri = `${applyServiceUri}/endemics/dev-sign-in`;

const createDevDetails = async (sbi) => {
  const organisationSummary = {
    organisationPermission: {},
    organisation: {
      sbi,
      name: "madeUpCo",
      email: "org@company.com",
      frn: "1100918140",
      address: {
        address1: "Somewhere",
      },
      businessReference: "1100918140",
    },
    name: "madeUpCo",
  };
  const personSummary = {
    email: "farmer@farm.com",
    customerReferenceNumber: "2054561445",
    firstName: "John",
    lastName: "Smith",
  };

  return [personSummary, organisationSummary];
};

function setOrganisationSessionData(
  request,
  personSummary,
  { organisation: org },
) {
  const organisation = {
    sbi: org.sbi,
    farmerName: getPersonName(personSummary),
    name: org.name,
    email: personSummary.email,
    orgEmail: org.email,
    address: getOrganisationAddress(org.address),
    crn: personSummary.customerReferenceNumber,
    frn: org.businessReference,
  };
  setFarmerApplyData(
    request,
    sessionKeys.farmerApplyData.organisation,
    organisation,
  );
  setEndemicsClaim(
    request,
    sessionKeys.endemicsClaim.organisation,
    organisation,
  );
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
  } else if (sbi.toUpperCase().endsWith("O")) {
    throw new OutstandingAgreementError(
      `Business with SBI ${sbi} must claim or withdraw agreement before creating another.`,
    );
  } else if (sbi.toUpperCase().endsWith("E")) {
    throw new ClaimHasExpiredError(
      `Claim has expired for reference - AHWR-MADE-UP1`,
      "20 December 2023",
      "20 June 2024",
    );
  }
}

export const devLoginHandlers = [
  {
    method: "GET",
    path: pageUrl,
    options: {
      auth: false,
      handler: async (request, h) => {
        const { sbi, cameFrom, tempApplicationId } = request.query;

        request.logger.info(`came from ${cameFrom} with ${tempApplicationId}`);

        setFarmerApplyData(
          request,
          sessionKeys.farmerApplyData.reference,
          tempApplicationId,
        );

        request.logger.setBindings({ sbi });
        const [personSummary, organisationSummary] =
          await createDevDetails(sbi);

        try {
          throwErrorBasedOnSuffix(sbi);
          const latestApplicationsForSbi = await getLatestApplicationsBySbi(
            sbi,
            request.logger,
          );

          setCustomer(request, sessionKeys.customer.id, personSummary.id);
          setCustomer(
            request,
            sessionKeys.customer.crn,
            personSummary.customerReferenceNumber,
          );
          setOrganisationSessionData(request, personSummary, {
            ...organisationSummary,
          });

          setAuthCookie(request, personSummary.email, farmerApply);

          const redirectPath = getRedirectPath(
            latestApplicationsForSbi,
            cameFrom,
            sbi,
          );

          return h.redirect(redirectPath);
        } catch (error) {
          const backLink =
            cameFrom === "apply"
              ? applyServiceRedirectUri
              : claimServiceRedirectUri;
          if (
            [
              "LockedBusinessError",
              "InvalidPermissionsError",
              "NoEligibleCphError",
              "OutstandingAgreementError",
              "NoEndemicsAgreementError",
              "ClaimHasExpired",
            ].includes(error.name)
          ) {
            return h
              .view("cannot-apply-exception", {
                error,
                ruralPaymentsAgency: config.ruralPaymentsAgency,
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
              ruralPaymentsAgency: config.ruralPaymentsAgency,
              message: error.data?.payload?.message ?? error.message,
            })
            .code(HttpStatus.BAD_REQUEST)
            .takeover();
        }
      },
    },
  },
];
