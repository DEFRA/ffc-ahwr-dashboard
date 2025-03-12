import Wreck from "@hapi/wreck";
import { config } from "../config/index.js";

export async function getLatestApplicationsBySbi(sbi, logger) {
  const endpoint = `${config.applicationApi.uri}/applications/latest?sbi=${sbi}`;
  try {
    const { payload } = await Wreck.get(endpoint, { json: true });

    return payload;
  } catch (err) {
    logger.setBindings({ err });
    throw err;
  }
}
