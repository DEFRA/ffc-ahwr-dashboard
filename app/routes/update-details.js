import { config } from "../config/index.js";
import { getEndemicsClaim } from "../session/index.js";

export const updateDetailsHandlers = [
  {
    method: "GET",
    path: "/update-details",
    options: {
      handler: async (request, h) => {
        if (!config.lfsUpdate.enabled) {
          return h.redirect("/check-details");
        }

        const { organisation } = getEndemicsClaim(request);
        return h.redirect(`${config.lfsUpdate.uri}${organisation.id}`)
      },
    },
  },
];
