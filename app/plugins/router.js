import { healthHandlers } from "../routes/health.js";
import { assetsRouteHandlers } from "../routes/assets.js";
import { cookieHandlers } from "../routes/cookies.js";
import { entryPointHandlers } from "../routes/index.js";
import { checkDetailsHandlers } from "../routes/check-details.js";
import { updateDetailsHandlers } from "../routes/update-details.js";
import { signinRouteHandlers } from "../routes/signin-oidc.js";
import { downloadApplicationHandlers } from "../routes/download-application.js";
import { vetVisitsHandlers } from "../routes/vet-visits.js";

const routes = [
  healthHandlers,
  assetsRouteHandlers,
  cookieHandlers,
  entryPointHandlers,
  checkDetailsHandlers,
  updateDetailsHandlers,
  signinRouteHandlers,
  downloadApplicationHandlers,
  vetVisitsHandlers,
].flat();

export const routerPlugin = {
  plugin: {
    name: "router",
    register: (server, _) => {
      server.route(routes);
    },
  },
};
