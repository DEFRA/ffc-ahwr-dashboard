import { authConfig } from "../../../../../../app/config/auth.js";
import { customerHasAtLeastOneValidCph } from "../../../../../../app/api-requests/rpa-api/cph-check";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const mswServer = setupServer();
mswServer.listen();

afterEach(() => {
  mswServer.resetHandlers();
});

afterAll(() => {
  mswServer.close();
});

test("cphCheck: returns false if RPA request is unsuccessful", async () => {
  const { ruralPaymentsAgency } = authConfig;

  const organisationId = "112233445";
  const state = {
    customer: {
      organisationId,
      crn: "1234567890",
    },
  };

  jest.replaceProperty(ruralPaymentsAgency, "hostname", "http://test.rpa");
  jest.replaceProperty(
    ruralPaymentsAgency,
    "getCphNumbersUrl",
    "/cph/organisation/organisationId",
  );
  const rpa = http.get(
    `http://test.rpa/cph/organisation/${organisationId}`,
    () =>
      HttpResponse.json({
        success: false,
        errorString: "test RPA failure",
      }),
  );

  mswServer.use(rpa);

  const request = {
    yar: {
      get: jest.fn().mockReturnValueOnce(state.customer),
    },
  };

  expect(await customerHasAtLeastOneValidCph(request, "token")).toBeFalsy();
});
