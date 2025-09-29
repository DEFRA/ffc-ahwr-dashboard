import {
  getCustomer,
  getEndemicsClaim,
  setEndemicsClaim,
} from "../session/index.js";
import { getLatestApplicationsBySbi } from "../api-requests/application-api.js";
import {
  getClaimsByApplicationReference,
  isWithinLastTenMonths,
} from "../api-requests/claim-api.js";
import nunjucks from "nunjucks";
import { applicationType, claimType } from "../constants/constants.js";
import { sessionKeys } from "../session/keys.js";
import { requestAuthorizationCodeUrl } from "../auth/auth-code-grant/request-authorization-code-url.js";
import { claimServiceUri, vetVisits } from "../config/routes.js";
import { config } from "../config/index.js";
import { showMultiHerdsBanner } from "./utils/show-multi-herds-banner.js";
import { RPA_CONTACT_DETAILS } from "ffc-ahwr-common-library";

const { latestTermsAndConditionsUri } = config;

const pageUrl = `/${vetVisits}`;
const claimServiceRedirectUri = `${claimServiceUri}/endemics/which-species`;
const centringClass = "vertical-middle";

const createRowsForTable = (claims) => {
  const env = nunjucks.configure([
    "app/views/snippets",
    "node_modules/govuk-frontend/dist",
  ]);

  return claims.map((claim) => {
    const newClaimVisitDate = claim.data.dateOfVisit;
    const oldClaimVisitDate = claim.data.visitDate;
    const dateOfVisit = new Date(newClaimVisitDate || oldClaimVisitDate);
    const formattedDateOfVisit = dateOfVisit.toLocaleString("en-gb", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const claimTypeText =
      (claim.data.claimType ?? claimType.review) === "R"
        ? "Review"
        : "Follow-up";
    const herdName =
      claim.herd?.herdName ??
      (claim.data.typeOfLivestock === "sheep"
        ? "Unnamed flock"
        : "Unnamed herd");

    return [
      {
        text: formattedDateOfVisit,
        attributes: {
          "data-sort-value": dateOfVisit.getTime(),
        },
        classes: centringClass,
      },
      {
        text: herdName,
        classes: centringClass,
      },
      {
        html: `<div>
                <p class="govuk-!-margin-0">${claimTypeText}</p>
                <p class="govuk-caption-m govuk-!-margin-0">${claim.reference}</p>
              </div>`,
      },
      {
        html: env.render("tag.njk", { status: claim.statusId }),
        classes: centringClass,
      },
    ];
  });
};

const buildClaimRowsPerSpecies = (allClaims, isOldWorld) => {
  const beefClaimsRows = createRowsForTable(
    allClaims.filter(
      (claim) =>
        (isOldWorld ? claim.data.whichReview : claim.data.typeOfLivestock) ===
        "beef",
    ),
  );
  const dairyClaimsRows = createRowsForTable(
    allClaims.filter(
      (claim) =>
        (isOldWorld ? claim.data.whichReview : claim.data.typeOfLivestock) ===
        "dairy",
    ),
  );
  const pigClaimsRows = createRowsForTable(
    allClaims.filter(
      (claim) =>
        (isOldWorld ? claim.data.whichReview : claim.data.typeOfLivestock) ===
        "pigs",
    ),
  );
  const sheepClaimsRows = createRowsForTable(
    allClaims.filter(
      (claim) =>
        (isOldWorld ? claim.data.whichReview : claim.data.typeOfLivestock) ===
        "sheep",
    ),
  );

  return { beefClaimsRows, dairyClaimsRows, pigClaimsRows, sheepClaimsRows };
};

const buildTableHeaders = () => {
  const sharedTableHeaders = [
    {
      text: "Visit date",
      attributes: {
        "aria-sort": "descending",
      },
      classes: "col-19",
    },
    {
      text: "Type and claim number",
      attributes: {
        "aria-sort": "none",
      },
      classes: "col-25",
    },
    {
      text: "Status",
      attributes: {
        "aria-sort": "none",
      },
      classes: "col-12",
    },
  ];

  const sheepHeaders = [...sharedTableHeaders];

  sheepHeaders.splice(1, 0, {
    text: "Flock name",
    attributes: {
      "aria-sort": "none",
    },
    classes: "col-44",
  });

  const nonSheepHeaders = [...sharedTableHeaders];

  nonSheepHeaders.splice(1, 0, {
    text: "Herd name",
    attributes: {
      "aria-sort": "none",
    },
    classes: "col-44",
  });

  return { sheepHeaders, nonSheepHeaders };
};

export const vetVisitsHandlers = [
  {
    method: "GET",
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { organisation } = getEndemicsClaim(request);

        request.logger.setBindings({ sbi: organisation.sbi });

        const { attachedToMultipleBusinesses } = getCustomer(request);
        const applications = await getLatestApplicationsBySbi(
          organisation.sbi,
          request.logger,
        );

        if (applications.length === 0) {
          throw new Error("User should not be attempting to access this page without an agreement.");
        }
        
        if (applications[0]?.applicationRedacts?.length) {
          return h.view("agreement-redacted", {
            error: 'AgreementRedactedError',
            ruralPaymentsAgency: RPA_CONTACT_DETAILS,
            privacyPolicyUri: config.privacyPolicyUri
          });
        }

        const vetVisitApplications = applications?.filter(
          (application) => application.type === applicationType.VET_VISITS,
        );
        const latestEndemicsApplication = applications?.find(
          (application) => application.type === applicationType.ENDEMICS,
        );

        const claims = latestEndemicsApplication
          ? await getClaimsByApplicationReference(
              latestEndemicsApplication?.reference,
              request.logger,
            )
          : [];

        const vetVisitApplicationsWithinLastTenMonths =
          vetVisitApplications.filter((application) =>
            isWithinLastTenMonths(application?.data?.visitDate),
          );
        const allClaims = [
          ...claims,
          ...vetVisitApplicationsWithinLastTenMonths,
        ];

        const isOldWorld = !latestEndemicsApplication;

        const {
          beefClaimsRows,
          dairyClaimsRows,
          pigClaimsRows,
          sheepClaimsRows,
        } = buildClaimRowsPerSpecies(allClaims, isOldWorld);

        setEndemicsClaim(
          request,
          sessionKeys.endemicsClaim.LatestEndemicsApplicationReference,
          latestEndemicsApplication?.reference,
        );
        const downloadedDocument = `/download-application/${organisation.sbi}/${latestEndemicsApplication?.reference}`;

        const showNotificationBanner =
          Boolean(latestEndemicsApplication) &&
          showMultiHerdsBanner(applications, claims);

        const { sheepHeaders, nonSheepHeaders } = buildTableHeaders();

        return h.view(vetVisits, {
          beefClaimsRows,
          dairyClaimsRows,
          pigClaimsRows,
          sheepClaimsRows,
          headers: {
            sheepHeaders,
            nonSheepHeaders,
          },
          showNotificationBanner,
          attachedToMultipleBusinesses,
          claimServiceRedirectUri,
          ...organisation,
          ...(latestEndemicsApplication?.reference && {
            reference: latestEndemicsApplication.reference,
          }),
          ...(latestEndemicsApplication?.reference && { downloadedDocument }),
          ...(attachedToMultipleBusinesses && {
            hostname: requestAuthorizationCodeUrl(request),
          }),
          latestTermsAndConditionsUri,
        });
      },
    },
  }
];
