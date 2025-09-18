import { StatusCodes } from "http-status-codes";

export const errorPagesPlugin = {
  plugin: {
    name: "error-pages",
    register: (server, _) => {
      server.ext("onPreResponse", (request, h) => {
        const response = request.response;

        if (response.isBoom) {
          const { payload } = response.output;
          const { statusCode, message: payloadMessage } = payload

          if (statusCode === StatusCodes.NOT_FOUND) {
            // handled specifically by a route handler that renders a 404 page for unknown pages
            return h.continue
          }

          if (statusCode >= StatusCodes.NOT_FOUND && statusCode < StatusCodes.INTERNAL_SERVER_ERROR) {
            return h
              .view("error-pages/4xx", { payload })
              .code(statusCode);
          }

          request.logger.error(
            {
              statusCode,
              message: payloadMessage,
              stack: response.data ? response.data.stack : response.stack,
            },
            "pre response error",
          );

          return h.view("error-pages/500").code(statusCode);
        }

        return h.continue;
      });
    },
  },
};
