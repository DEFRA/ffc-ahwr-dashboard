import { setCustomer, setEndemicsClaim, setFarmerApplyData } from "../../session/index.js";
import { sessionKeys } from "../../session/keys.js";
import { getOrganisation, getOrganisationAuthorisation, organisationHasPermission } from "./organisation.js";
import { getPersonSummary } from "./person.js";

const formatOrganisationAddress = (address) => {
    return [
      address?.address1,
      address?.address2,
      address?.address3,
      address?.address4,
      address?.address5,
      address?.pafOrganisationName,
      address?.flatName,
      address?.buildingNumberRange,
      address?.buildingName,
      address?.street,
      address?.city,
      address?.county,
      address?.postalCode,
      address?.country,
    ]
      .filter(Boolean)
      .join(",");
}

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

export const getPersonAndOrg = async ({ request, apimAccessToken, crn, logger, accessToken }) => {
    const organisationId = accessToken.currentRelationshipId;

    const [personSummaryResult, organisationAuthorisationResult, organisationResult] =
      await Promise.allSettled([getPersonSummary(request, apimAccessToken, crn, logger), getOrganisationAuthorisation(request, organisationId, apimAccessToken), getOrganisation(request, organisationId, apimAccessToken)]);
    if(personSummaryResult.status === "rejected" || organisationAuthorisationResult.status === "rejected" || organisationResult.status === "rejected") {
      throw new AggregateError([personSummaryResult, organisationAuthorisationResult, organisationResult]
        .filter(x => x.status === "rejected")
        .map(x => new Error(x.reason)), 'Failed to retrieve person or organisation details');
    }
    const personSummary = personSummaryResult.value;
    const organisationAuthorisation = organisationAuthorisationResult.value;
    const organisation = organisationResult.value;
    const organisationPermission = organisationHasPermission({ organisationAuthorisation, personId: personSummary.id });

    setCustomer(request, sessionKeys.customer.id, personSummary.id);

    const personAndOrg = {
      orgDetails: {
        organisationPermission,
        organisation: {
          ...organisation,
          address: formatOrganisationAddress(organisation.address),
        },
      },
      personSummary,
    };

    setOrganisationSessionData(request, personSummary, personAndOrg.orgDetails.organisation, crn);

    return personAndOrg;
}