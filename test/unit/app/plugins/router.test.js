import { createServer } from "../../../../app/server.js";
import { config } from "../../../../app/config/index.js";

jest.mock("../../../../app/constants/claim-statuses.js", () => ({
  closedViewStatuses: [2, 10, 7, 9]
}));

describe("routes plugin test", () => {

  beforeEach(() => {
    jest.resetModules();
  });

  test("routes included", async () => {

    const server = await createServer();
    const routePaths = [];
    server.table().forEach((element) => {
      routePaths.push(element.path);
    });
    expect(routePaths).toEqual([
      "/accessibility",
      "/cannot-sign-in",
      "/check-details",
      "/cookies",
      "/healthy",
      "/healthz",
      "/sign-in",
      "/sign-out",
      "/signin-oidc",
      "/update-details",
      "/vet-visits",
      "/",
      "/assets/{path*}",
      "/download-application/{sbi}/{reference}",
      "/check-details",
      "/cookies"
    ]);
  });

  test("when isDev is true, dev-sign-in included in routes", async () => {
    config.devLogin.enabled = true;

    const server = await createServer();
    const routePaths = [];
    server.table().forEach((element) => {
      routePaths.push(element.path);
    });

    expect(routePaths).toContain("/dev-sign-in");
  });
});
