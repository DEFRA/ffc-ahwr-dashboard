import { createServer } from "../../../../app/server.js";
import { authConfig } from "../../../../app/config/auth.js";

jest.mock("../../../../app/constants/claim-statuses.js", () => ({
  closedViewStatuses: [2, 10, 7, 9]
}));

test("get /", async () => {
  const server = await createServer();
  const res = await server.inject({
    url: "/",
    auth: {
      credentials: {},
      strategy: "cookie",
    },
  });

  expect(res.statusCode).toBe(302);
  expect(res.headers.location).toBe("/vet-visits");
});

test("get /: no auth", async () => {
  const hostname = "http://www.auth.test";
  const path = "/auth-test";

  jest.replaceProperty(authConfig.defraId, "hostname", hostname);
  jest.replaceProperty(authConfig.defraId, "oAuthAuthorisePath", path);

  const server = await createServer();
  const res = await server.inject({
    url: "/",
  });

  expect(res.statusCode).toBe(302);
  expect(res.headers.location.href).toMatch(`${hostname}${path}`);
});
