import { requestAuthorizationCodeUrl } from "../../../../app/auth/auth-code-grant/request-authorization-code-url.js";
import { authenticate } from "../../../../app/auth/authenticate.js";
import { verifyState } from "../../../../app/auth/auth-code-grant/state.js";

jest.mock("../../../../app/session");
jest.mock("../../../../app/auth/auth-code-grant/state");

jest.mock("applicationinsights", () => ({
  defaultClient: { trackException: jest.fn() },
  dispose: jest.fn(),
}));

describe("Generate authentication url test", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test("when requestAuthorizationCodeUrl with pkce true challenge parameter added", async () => {
    const result = requestAuthorizationCodeUrl(undefined);
    const params = new URL(result).searchParams;
    expect(params.get("code_challenge")).not.toBeNull();
  });

  test("when requestAuthorizationCodeUrl with pkce false no challenge parameter is added", async () => {
    const result = requestAuthorizationCodeUrl(undefined);
    const params = new URL(result).searchParams;
    expect(params.get("code_challenge")).toBeNull();
  });

  test("when invalid state occurs", async () => {
    verifyState.mockReturnValueOnce(false);
    const request = { yar: { id: "33" }, logger: { setBindings: jest.fn() } };
    const mockLogger = {
      setBindings: jest.fn(),
    };
    const mockRedirect = jest.fn();
    const mockH = {
      redirect: mockRedirect
    };
    
    await authenticate(request, mockH, mockLogger);
    expect(mockRedirect).toHaveBeenCalled();
  });
});
