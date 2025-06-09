import { createServer } from "../../../../app/server.js";
import { config } from "../../../../app/config/index.js";
import globalJsdom from "global-jsdom";
import { getByRole } from "@testing-library/dom";
import { http, HttpResponse } from "msw";
import { applicationStatus } from "../../../../app/constants/constants.js";
import { setupServer } from "msw/node";

const mswServer = setupServer();
mswServer.listen();

afterEach(() => {
  mswServer.resetHandlers();
});

afterAll(() => {
  mswServer.close();
});

jest.mock("../../../../app/session/index.js", () => ({
  ...jest.requireActual("../../../../app/session/index.js"),
  setFarmerApplyData: jest.fn(),
}));

describe("Dev sign in page test", () => {
  test("GET dev sign-in route returns redirect to apply journey if not applied yet", async () => {
    config.devLogin.enabled = true;
    const sbi = "123456789";
    const server = await createServer();

    const getLatestApplicationsBySbi = http.get(
      `${config.applicationApi.uri}/applications/latest`,
      ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get("sbi") !== sbi) {
          return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json([]);
      },
    );
    mswServer.use(getLatestApplicationsBySbi);

    const res = await server.inject({
      url: `/dev-sign-in?sbi=${sbi}&cameFrom=apply&tempApplicationId=ABCD-1234`,
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(
      `${config.applyServiceUri}/endemics/check-details`,
    );
  });

  test("GET dev sign-in route returns redirect to dashboard if already signed up for an EE application", async () => {
    config.devLogin.enabled = true;
    const sbi = "123456789";
    const server = await createServer();

    const getLatestApplicationsBySbi = http.get(
      `${config.applicationApi.uri}/applications/latest`,
      ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get("sbi") !== sbi) {
          return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json([
          {
            type: "EE",
            statusId: applicationStatus.AGREED,
            createdAt: new Date(),
          },
        ]);
      },
    );
    mswServer.use(getLatestApplicationsBySbi);

    const res = await server.inject({
      url: `/dev-sign-in?sbi=${sbi}&cameFrom=apply&tempApplicationId=ABCD-1234`,
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`/check-details`);
  });

  test("GET dev sign-in route returns redirect to apply journey if signed up for a closed VV application", async () => {
    config.devLogin.enabled = true;
    const sbi = "123456789";
    const server = await createServer();

    const getLatestApplicationsBySbi = http.get(
      `${config.applicationApi.uri}/applications/latest`,
      ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get("sbi") !== sbi) {
          return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json([
          {
            type: "VV",
            statusId: applicationStatus.READY_TO_PAY,
            createdAt: new Date(),
          },
        ]);
      },
    );
    mswServer.use(getLatestApplicationsBySbi);

    const res = await server.inject({
      url: `/dev-sign-in?sbi=${sbi}&cameFrom=apply&tempApplicationId=ABCD-1234`,
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(
      `${config.applyServiceUri}/endemics/check-details`,
    );
  });

  test("GET dev sign-in route forwards to error page when coming from apply if signed up for an open VV application", async () => {
    config.devLogin.enabled = true;
    const sbi = "123456789";
    const server = await createServer();

    const getLatestApplicationsBySbi = http.get(
      `${config.applicationApi.uri}/applications/latest`,
      ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get("sbi") !== sbi) {
          return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json([
          {
            type: "VV",
            statusId: applicationStatus.AGREED,
            createdAt: new Date(),
          },
        ]);
      },
    );
    mswServer.use(getLatestApplicationsBySbi);

    const res = await server.inject({
      url: `/dev-sign-in?sbi=${sbi}&cameFrom=apply&tempApplicationId=ABCD-1234`,
    });

    globalJsdom(res.payload);
    expect(res.statusCode).toBe(400);

    expect(
      getByRole(document.body, "heading", {
        level: 1,
        name: "You have an existing agreement for this business",
      }),
    ).toBeDefined();
  });

  test("GET dev sign-in route forwards to error page when trying to claim for an open VV application", async () => {
    config.devLogin.enabled = true;
    const sbi = "123456789";
    const server = await createServer();

    const getLatestApplicationsBySbi = http.get(
      `${config.applicationApi.uri}/applications/latest`,
      ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get("sbi") !== sbi) {
          return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json([
          {
            type: "VV",
            statusId: applicationStatus.AGREED,
            createdAt: new Date(),
          },
        ]);
      },
    );
    mswServer.use(getLatestApplicationsBySbi);

    const res = await server.inject({
      url: `/dev-sign-in?sbi=${sbi}&cameFrom=claim`,
    });

    globalJsdom(res.payload);
    expect(res.statusCode).toBe(400);

    expect(
      getByRole(document.body, "heading", {
        level: 1,
        name: "You cannot claim for a livestock review for this business",
      }),
    ).toBeDefined();
  });

  test("GET dev sign-in route forwards to error page when trying to claim and no application exists", async () => {
    config.devLogin.enabled = true;
    const sbi = "123456789";
    const server = await createServer();

    const getLatestApplicationsBySbi = http.get(
      `${config.applicationApi.uri}/applications/latest`,
      ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get("sbi") !== sbi) {
          return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json([]);
      },
    );
    mswServer.use(getLatestApplicationsBySbi);

    const res = await server.inject({
      url: `/dev-sign-in?sbi=${sbi}&cameFrom=claim`,
    });

    globalJsdom(res.payload);
    expect(res.statusCode).toBe(400);

    expect(
      getByRole(document.body, "heading", {
        level: 1,
        name: "You do not have an agreement for this business",
      }),
    ).toBeDefined();
  });

  test("GET dev sign-in route forwards to error page when forced to show CPH error", async () => {
    config.devLogin.enabled = true;
    const sbi = "123c";
    const server = await createServer();

    const getLatestApplicationsBySbi = http.get(
      `${config.applicationApi.uri}/applications/latest`,
      ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get("sbi") !== sbi) {
          return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json([]);
      },
    );
    mswServer.use(getLatestApplicationsBySbi);

    const res = await server.inject({
      url: `/dev-sign-in?sbi=${sbi}&cameFrom=claim`,
    });

    globalJsdom(res.payload);
    expect(res.statusCode).toBe(400);

    expect(
      getByRole(document.body, "heading", {
        level: 1,
        name: "You cannot apply for reviews or follow-ups for this business",
      }),
    ).toBeDefined();
  });

  test("GET dev sign-in route forwards to error page when forced to show Invalid permissions error", async () => {
    config.devLogin.enabled = true;
    const sbi = "123i";
    const server = await createServer();

    const getLatestApplicationsBySbi = http.get(
      `${config.applicationApi.uri}/applications/latest`,
      ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get("sbi") !== sbi) {
          return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json([]);
      },
    );
    mswServer.use(getLatestApplicationsBySbi);

    const res = await server.inject({
      url: `/dev-sign-in?sbi=${sbi}&cameFrom=claim`,
    });

    globalJsdom(res.payload);
    expect(res.statusCode).toBe(400);

    expect(
      getByRole(document.body, "heading", {
        level: 1,
        name: "You cannot apply for reviews or follow-ups for this business",
      }),
    ).toBeDefined();
  });

  test("GET dev sign-in route forwards to error page when forced to show locked business error", async () => {
    config.devLogin.enabled = true;
    const sbi = "123l";
    const server = await createServer();

    const getLatestApplicationsBySbi = http.get(
      `${config.applicationApi.uri}/applications/latest`,
      ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get("sbi") !== sbi) {
          return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json([]);
      },
    );
    mswServer.use(getLatestApplicationsBySbi);

    const res = await server.inject({
      url: `/dev-sign-in?sbi=${sbi}&cameFrom=claim`,
    });

    globalJsdom(res.payload);
    expect(res.statusCode).toBe(400);

    expect(
      getByRole(document.body, "heading", {
        level: 1,
        name: "You cannot apply for reviews or follow-ups for this business",
      }),
    ).toBeDefined();
  });

  test("GET dev sign-in route forwards to cannot login error page when unknown error encountered", async () => {
    config.devLogin.enabled = true;
    const sbi = "123456789";
    const server = await createServer();

    const getLatestApplicationsBySbi = http.get(
      `${config.applicationApi.uri}/applications/latest`,
      ({ _request }) => {
        return HttpResponse.error();
      },
    );
    mswServer.use(getLatestApplicationsBySbi);

    const res = await server.inject({
      url: `/dev-sign-in?sbi=${sbi}&cameFrom=claim`,
    });

    globalJsdom(res.payload);
    expect(res.statusCode).toBe(400);

    expect(
      getByRole(document.body, "heading", {
        level: 1,
        name: "Login failed",
      }),
    ).toBeDefined();
  });

  test("GET dev defraid sign-in route returns redirect to defraId", async () => {
    config.devLogin.enabled = true;
    const server = await createServer();

    const res = await server.inject({
      url: `/dev-defraid`,
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location.href).toMatch(
      `onmicrosoft.com/oauth2/v2.0/authorize`,
    );
  });
});
