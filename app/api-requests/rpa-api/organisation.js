import { get } from "./base.js";
import { authConfig } from "../../config/auth.js";

const validPermissions = ["Submit - bps", "Full permission - business"];

export const getOrganisationAuthorisation = async (request, organisationId, apimToken) => {
  const { hostname, getOrganisationPermissionsUrl } = authConfig.ruralPaymentsAgency;

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

export const organisationHasPermission = ({ organisationAuthorisation, personId }) => {
  const personPrivileges = organisationAuthorisation.personPrivileges.filter(
    (privilege) => privilege.personId === personId
  );

  return personPrivileges.some((privilege) => permissionMatcher(privilege.privilegeNames, validPermissions));
};

export const getOrganisation = async (request, organisationId, apimToken) => {
  const { hostname, getOrganisationUrl } = authConfig.ruralPaymentsAgency;
  const response = await get(
    hostname,
    getOrganisationUrl.replace("organisationId", organisationId),
    request,
    { Authorization: apimToken },
  );

  return response?._data;
};

