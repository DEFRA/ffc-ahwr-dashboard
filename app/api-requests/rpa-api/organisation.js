import { get } from "./base.js";
import { getToken } from "../../session/index.js";
import { sessionKeys } from "../../session/keys.js";
import { decodeJwt } from "../../auth/token-verify/jwt-decode.js";
import { authConfig } from "../../config/auth.js";

const validPermissions = ["Submit - bps", "Full permission - business"];
let apimToken;

export function getOrganisationAddress(address) {
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

function parsedAccessToken(request) {
  const accessToken = getToken(request, sessionKeys.tokens.accessToken);
  return decodeJwt(accessToken);
}

const getOrganisationAuthorisation = async (request, organisationId) => {
  const { hostname, getOrganisationPermissionsUrl } =
    authConfig.ruralPaymentsAgency;

  const response = await get(
    hostname,
    getOrganisationPermissionsUrl.replace("organisationId", organisationId),
    request,
    { Authorization: apimToken },
  );
  return response?.data;
};

const permissionMatcher = (permissions, permissionToMatch) => {
  return permissions.every((value) => permissionToMatch.includes(value));
};

const organisationHasPermission = async (
  request,
  permissions,
  personId,
  organisationId,
) => {
  const organisationAuthorisation = await getOrganisationAuthorisation(
    request,
    organisationId,
  );
  const personPrivileges = organisationAuthorisation.personPrivileges.filter(
    (privilege) => privilege.personId === personId,
  );
  return personPrivileges.some((privilege) =>
    permissionMatcher(privilege.privilegeNames, permissions),
  );
};

const getOrganisation = async (request, organisationId) => {
  const { hostname, getOrganisationUrl } = authConfig.ruralPaymentsAgency;
  const response = await get(
    hostname,
    getOrganisationUrl.replace("organisationId", organisationId),
    request,
    { Authorization: apimToken },
  );
  return response?._data;
};

export const organisationIsEligible = async (
  request,
  personId,
  apimAccessToken,
) => {
  apimToken = apimAccessToken;
  const organisationId = parsedAccessToken(request).currentRelationshipId;
  const organisationPermission = await organisationHasPermission(
    request,
    validPermissions,
    personId,
    organisationId,
  );
  const organisation = await getOrganisation(request, organisationId);

  return {
    organisationPermission,
    organisation,
  };
};
