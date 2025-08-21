import { clearAllOfSession } from "../session/index.js";
import { clearAuthCookie } from "../auth/cookie-auth/cookie-auth.js";
import { claimServiceUri } from "../config/routes.js";

export const signOutHandlers = [
  {
    method: "GET",
    path: "/sign-out",
    options: {
      handler: async (request, h) => {
        clearAllOfSession(request);
        clearAuthCookie(request);
        return h.redirect(claimServiceUri);
      },
    },
  },
];
