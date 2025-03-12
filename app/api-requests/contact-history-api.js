import Wreck from "@hapi/wreck";
import appInsights from "applicationinsights";
import { config } from "../config/index.js";
import { getOrganisationAddress } from "./rpa-api/organisation.js";
import { getPersonName } from "./rpa-api/person.js";

export async function updateContactHistory(data, logger) {
  const endpoint = `${config.applicationApiUri}/application/contact-history`;
  try {
    const { payload } = await Wreck.put(endpoint, {
      payload: data,
      json: true,
    });

    return payload;
  } catch (err) {
    logger.setBindings({ err, endpoint });
    appInsights.defaultClient.trackException({ exception: err });
    throw err;
  }
}

export const changeContactHistory = async (
  personSummary,
  organisationSummary,
  logger,
) => {
  const currentAddress = getOrganisationAddress(organisationSummary.address);
  await updateContactHistory(
    {
      farmerName: getPersonName(personSummary),
      orgEmail: organisationSummary.email,
      email: personSummary.email
        ? personSummary.email
        : organisationSummary.email,
      sbi: organisationSummary.sbi,
      address: currentAddress,
      user: "admin",
    },
    logger,
  );
};
