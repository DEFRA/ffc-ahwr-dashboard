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
import { userNeedsNotification } from "./utils/user-needs-notification.js";

const { latestTermsAndConditionsUri } = config;

const pageUrl = `/${vetVisits}`;
const claimServiceRedirectUri = `${claimServiceUri}/endemics?from=dashboard`;

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

        const env = nunjucks.configure([
          "app/views/snippets",
          "node_modules/govuk-frontend/dist",
        ]);

        const claimsRows = allClaims.map((claim) => {
          const newClaimVisitDate = claim.data.dateOfVisit;
          const oldClaimVisitDate = claim.data.visitDate;
          const dateOfVisit = new Date(newClaimVisitDate || oldClaimVisitDate);
          const formattedDateOfVisit = dateOfVisit.toLocaleString("en-gb", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });

          return [
            {
              text: formattedDateOfVisit,
              attributes: {
                "data-sort-value": dateOfVisit.getTime(),
              },
            },
            {
              text: env.render("species.njk", {
                species: claim.data.typeOfLivestock ?? claim.data.whichReview,
              }),
            },
            {
              text: env.render("claim-type.njk", {
                claimType: claim.data.claimType ?? claimType.review,
              }),
            },
            { text: claim.reference },
            { html: env.render("tag.njk", { status: claim.statusId }) },
          ];
        });

        setEndemicsClaim(
          request,
          sessionKeys.endemicsClaim.LatestEndemicsApplicationReference,
          latestEndemicsApplication?.reference,
        );
        const downloadedDocument = `/download-application/${organisation.sbi}/${latestEndemicsApplication?.reference}`;

        const showNotificationBanner =
          Boolean(latestEndemicsApplication) &&
          userNeedsNotification(applications, claims);

        return h.view(vetVisits, {
          claimsRows,
          showNotificationBanner,
          attachedToMultipleBusinesses,
          claimServiceRedirectUri: `${claimServiceRedirectUri}&sbi=${organisation.sbi}`,
          ...organisation,
          ...(latestEndemicsApplication?.reference && {
            reference: latestEndemicsApplication?.reference,
          }),
          ...(latestEndemicsApplication?.reference && { downloadedDocument }),
          ...(attachedToMultipleBusinesses && {
            hostname: requestAuthorizationCodeUrl(request),
          }),
          latestTermsAndConditionsUri,
        });
      },
    },
  },
];
