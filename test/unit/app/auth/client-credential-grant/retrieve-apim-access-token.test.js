import wreck from "@hapi/wreck";
import HttpStatus from "http-status-codes";
import { retrieveApimAccessToken } from "../../../../../app/auth/client-credential-grant/retrieve-apim-access-token.js";

jest.mock("@hapi/wreck");

describe("Retrieve apim access token", () => {
  test("when retrieveApimAccessToken called - returns valid access token", async () => {
    const tokenType = "Bearer";
    const token = "access-token";
    const wreckResponse = {
      payload: {
        token_type: tokenType,
        access_token: token,
      },
      res: {
        statusCode: HttpStatus.OK,
      },
    };

    wreck.post = jest.fn().mockResolvedValueOnce(wreckResponse);

    const request = { logger: { setBindings: jest.fn() } };
    const result = await retrieveApimAccessToken(request);

    expect(result).toMatch(`${tokenType} ${token}`);
  });

  test("when retrieveApimAccessToken called - error thrown when not HttpStatus.StatusCodes.OK status code", async () => {
    const wreckResponse = {
      res: {
        statusCode: 404,
        statusMessage: "Call failed",
      },
    };

    wreck.post = jest.fn().mockRejectedValueOnce(wreckResponse);

    const request = { logger: { setBindings: jest.fn() } };
    await expect(
      async () => await retrieveApimAccessToken(request),
    ).rejects.toEqual(wreckResponse);
  });
});
