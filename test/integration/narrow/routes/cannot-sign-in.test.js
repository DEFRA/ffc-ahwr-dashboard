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

  test("it returns a 400 if the necessary query params are not provided", async () => {
    const res = await server.inject({
      url: '/cannot-sign-in',
      auth: {
        credentials: {},
        strategy: "cookie",
      },
    });
  
    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
  });

  test("it returns a 500 if the necessary query params are provided but the org is not encoded", async () => {
    const res = await server.inject({
      url: '/cannot-sign-in?error=ExpiredOldWorldApplication&hasMultipleBusinesses=false&backLink=something&organisation=something',
      auth: {
        credentials: {},
        strategy: "cookie",
      },
    });
  
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  test("it returns a 200 if the necessary query params are provided", async () => {
    const org = {
      address: "1 Brown Lane,Smithering,West Sussex,England,UK,Thompsons,Sisterdene,1-30,Grey Building,Brown Lane,Grenwald,West Sussex,WS11 2DS,GBR",
      email: "unit@test.email.com.test",
      name: "Unit test org",
      sbi: 999000,
    };

    const encodedOrg = Buffer.from(JSON.stringify(org)).toString("base64");
    const res = await server.inject({
      url: `/cannot-sign-in?error=ExpiredOldWorldApplication&hasMultipleBusinesses=false&backLink=something&organisation=${encodedOrg}`,
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

