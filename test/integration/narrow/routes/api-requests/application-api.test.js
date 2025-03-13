import { setupServer } from "msw/node";
import { config } from "../../../../../app/config/index.js";
import { getLatestApplicationsBySbi } from "../../../../../app/api-requests/application-api.js";
import { http, HttpResponse } from "msw";

const mswServer = setupServer();
mswServer.listen();

afterEach(() => {
  mswServer.resetHandlers();
});

afterAll(() => {
  mswServer.close();
});

test("getLatestApplicationsBySbi: throws returned errors", async () => {
  const logger = {
    setBindings: jest.fn(),
  };

  const appService = http.get(
    `${config.applicationApi.uri}/applications/latest`,
    () =>
      new HttpResponse(null, {
        status: 400,
        statusText: "Bad Request",
      }),
  );

  mswServer.use(appService);

  await expect(getLatestApplicationsBySbi("101010101", logger)).rejects.toThrow(
    "Response Error: 400 Bad Request",
  );
});
