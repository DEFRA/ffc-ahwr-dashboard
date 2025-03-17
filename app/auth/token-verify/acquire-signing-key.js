import Wreck from "@hapi/wreck";
import { authConfig } from "../../config/auth.js";

export const acquireSigningKey = async () => {
  const { payload } = await Wreck.get(
    `${authConfig.defraId.hostname}/discovery/v2.0/keys?p=${authConfig.defraId.policy}`,
    {
      json: true,
    },
  );
  return payload.keys[0];
};
