import { createServer } from "../../../../app/server.js";
import { config } from "../../../../app/config/index.js";

describe("routes plugin test", () => {
  jest.mock("../../../../app/config", () => ({
    ...jest.requireActual("../../../../app/config"),
    endemics: {
      enabled: false,
    },
  }));

  beforeEach(() => {
    jest.resetModules();
  });

  test("routes included", async () => {
    jest.mock("../../../../app/config", () => ({
      ...jest.requireActual("../../../../app/config"),
      endemics: {
        enabled: true,
      },
    }));

    const server = await createServer();
    const routePaths = [];
    server.table().forEach((element) => {
      routePaths.push(element.path);
    });
    expect(routePaths).toEqual([
      "/accessibility",
      "/check-details",
      "/cookies",
      "/healthy",
      "/healthz",
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
