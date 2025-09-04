import { StatusCodes } from "http-status-codes";
import { createServer } from "../../../../app/server.js";
import { getToken } from "../../../../app/session/index.js";
import { getSignOutUrl } from "../../../../app/routes/sign-out.js";

jest.mock("../../../../app/session/index.js");
jest.mock("../../../../app/auth/cookie-auth/cookie-auth.js");
jest.mock("../../../../app/routes/sign-out.js");

jest.mock("../../../../app/constants/claim-statuses.js", () => ({
    closedViewStatuses: [2, 10, 7, 9]
  }));

describe("GET /cannot-sign-in handler", () => {
  let server;

  beforeAll(async () => {
    server = await createServer();
  });

  test("it returns a 400 if the payload query param is not provided", async () => {
    const res = await server.inject({
      url: '/cannot-sign-in',
      auth: {
        credentials: {},
        strategy: "cookie",
      },
    });
  
    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
  });

  test("it returns a 500 if the payload query param is provided but the encoded contents are not correct", async () => {
    const encodedPayload = Buffer.from(JSON.stringify({ someStuff: 1 })).toString("base64");
    const res = await server.inject({
      url: `/cannot-sign-in?payload=${encodedPayload}`,
      auth: {
        credentials: {},
        strategy: "cookie",
      },
    });
  
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("it returns a 200 if the payload query param is provided and has the valid content required", async () => {
    const organisation = {
      address: "1 Brown Lane,Smithering,West Sussex,England,UK,Thompsons,Sisterdene,1-30,Grey Building,Brown Lane,Grenwald,West Sussex,WS11 2DS,GBR",
      email: "unit@test.email.com.test",
      name: "Unit test org",
      sbi: 999000,
    };
    const error = "ExpiredOldWorldApplication";
    const hasMultipleBusinesses = "false";
    const backLink = "something";

    const payload = { 
      error,
      hasMultipleBusinesses,
      backLink,
      organisation
    };
    const base64EncodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64");

    const res = await server.inject({
      url: `/cannot-sign-in?payload=${base64EncodedPayload}`,
      auth: {
        credentials: {},
        strategy: "cookie",
      },
    });
  
    expect(res.statusCode).toBe(StatusCodes.OK);
    expect(getToken).toHaveBeenCalled();
    expect(getSignOutUrl).toHaveBeenCalled();
  });
});

