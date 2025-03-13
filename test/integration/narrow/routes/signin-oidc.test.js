import { config } from "../../../../app/config/index.js";
import { authConfig } from "../../../../app/config/auth.js";
import { setupServer } from "msw/node";
import {
  generateJWK,
  generateKeys,
} from "../../../helpers/generate-keys-and-jwk.js";
import { createServer } from "../../../../app/server.js";
import jsonwebtoken from "jsonwebtoken";
import { http, HttpResponse } from "msw";
import { setServerState } from "../../../helpers/set-server-state.js";
import globalJsdom from "global-jsdom";
import { getByRole } from "@testing-library/dom";
import { applicationStatus } from "../../../../app/constants/constants.js";
import * as session from "../../../../app/session/index.js";

const mswServer = setupServer();
mswServer.listen();

afterEach(() => {
  mswServer.resetHandlers();
});

afterAll(() => {
  mswServer.close();
});

jest.mock(
  "form-data",
  () =>
    class Formdata {
      append() {}
      getHeaders() {}
    },
);

jest.mock("applicationinsights", () => ({
  defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() },
  dispose: jest.fn(),
}));

jest.mock("../../../../app/session/index.js", () => ({
  ...jest.requireActual("../../../../app/session/index.js"),
  setFarmerApplyData: jest.fn(),
}));

const commonAuthHandlers = (crn, organisationId, nonce) => {
  const { defraId, apim } = authConfig;
  const accessToken = {
    contactId: crn,
    currentRelationshipId: organisationId,
    enrolmentCount: 1,
    roles: [],
    iss: `https://${defraId.tenantName}.b2clogin.com/${defraId.jwtIssuerId}/v2.0/`,
  };
  const idToken = { nonce };

  const { publicKey, privateKey } = generateKeys();
  const signinKey = generateJWK(publicKey);

  const jwt = jsonwebtoken.sign(accessToken, privateKey, {
    algorithm: "RS256",
  });
  const idTokenJWT = jsonwebtoken.sign(idToken, privateKey, {
    algorithm: "RS256",
  });

  const defraIdToken = http.post(
    `${defraId.hostname}/${defraId.policy}/oauth2/v2.0/token`,
    () =>
      HttpResponse.json({
        expires_in: 3600,
        access_token: jwt,
        id_token: idTokenJWT,
      }),
  );

  const acquireSigningKey = http.get(
    `${defraId.hostname}/discovery/v2.0/keys`,
    () => HttpResponse.json({ keys: [signinKey] }),
  );

  jest.replaceProperty(apim, "hostname", "http://apim.test");
  jest.replaceProperty(apim, "oAuthPath", "/test");
  const apimAccessToken = http.post("http://apim.test/test", () =>
    HttpResponse.json({}),
  );

  return {
    defraIdToken,
    acquireSigningKey,
    apimAccessToken,
  };
};

const commonRPAHandlers = (
  personId,
  privilegeNames,
  organisation,
  cphNumbers,
) => {
  const { ruralPaymentsAgency } = authConfig;
  const rpaHost = "http://rpa.uk";
  const getPersonSummaryUrl = "/person/3337243/summary";

  jest.replaceProperty(ruralPaymentsAgency, "hostname", rpaHost);
  jest.replaceProperty(
    ruralPaymentsAgency,
    "getPersonSummaryUrl",
    getPersonSummaryUrl,
  );

  const getPersonSummary = http.get(`${rpaHost}${getPersonSummaryUrl}`, () =>
    HttpResponse.json({
      _data: {
        id: personId,
        email: "farmer@farm.com",
        firstName: "John",
        middleName: "Jane",
        lastName: "Doe",
      },
    }),
  );

  jest.replaceProperty(
    ruralPaymentsAgency,
    "getOrganisationPermissionsUrl",
    "/rpa/org/organisationId/auth",
  );
  const getOrganisationAuthorisation = http.get(
    `${rpaHost}/rpa/org/${organisation.id}/auth`,
    () =>
      HttpResponse.json({
        data: {
          personPrivileges: [
            {
              personId,
              privilegeNames,
            },
          ],
        },
      }),
  );

  jest.replaceProperty(
    ruralPaymentsAgency,
    "getOrganisationUrl",
    "/rpa/vet-visits/organisationId",
  );
  const getOrganisation = http.get(
    `${rpaHost}/rpa/vet-visits/${organisation.id}`,
    () =>
      HttpResponse.json({
        _data: organisation,
      }),
  );

  jest.replaceProperty(
    ruralPaymentsAgency,
    "getCphNumbersUrl",
    "/cph/organisation/organisationId",
  );
  const getCphNumbers = http.get(
    `${rpaHost}/cph/organisation/${organisation.id}`,
    () =>
      HttpResponse.json({
        success: true,
        data: cphNumbers,
      }),
  );

  return {
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    getCphNumbers,
  };
};

const commonApplicationHandlers = () => {
  const updateContactHistory = http.put(
    `${config.applicationApiUri}/application/contact-history`,
    () => HttpResponse.json([]),
  );

  return { updateContactHistory };
};

test("get /signin-oidc: approved application", async () => {
  const server = await createServer();

  const rawState = {
    id: "344875ca-02ab-4a4e-a136-77b576569318",
    source: "dashboard",
  };
  const encodedState = Buffer.from(JSON.stringify(rawState)).toString("base64");

  const crn = "1100021396";
  const sbi = "106354662";
  const organisationId = "5501559";
  const nonce = "f0b70cd8-12a6-4e4e-a664-64bd7888b0d9";

  const state = {
    tokens: {
      nonce,
      state: encodedState,
    },
    pkcecodes: {
      verifier: "wsfnhWoz2TP5eg9n7-qLgr83XB4IJWUdZ9e6RZrlOTI",
    },
    customer: {
      crn,
    },
  };
  await setServerState(server, state);

  const { defraIdToken, acquireSigningKey, apimAccessToken } =
    commonAuthHandlers(crn, organisationId, nonce);

  const personId = "7357";
  const privilegeNames = ["Full permission - business"];
  const organisation = {
    id: organisationId,
    sbi,
    email: "johndoe@gmail.com",
    businessReference: "107262457",
    name: "Willow Farm",
    address: {
      address1: "Flat 2 Fiona Overpass",
      address2: "City Simpsonfort",
      city: "Huntbury",
      postalCode: "SA71 5BP",
    },
  };
  const cphNumbers = [{ cphNumber: "29/004/0005" }];
  const {
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    getCphNumbers,
  } = commonRPAHandlers(personId, privilegeNames, organisation, cphNumbers);

  const { updateContactHistory } = commonApplicationHandlers();

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
        },
      ]);
    },
  );

  mswServer.use(
    defraIdToken,
    acquireSigningKey,
    apimAccessToken,
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    updateContactHistory,
    getCphNumbers,
    getLatestApplicationsBySbi,
  );

  const res = await server.inject({
    url: `/signin-oidc?state=${encodedState}&code=123`,
  });

  expect(session.setFarmerApplyData).toHaveBeenCalledWith(
    expect.any(Object),
    "organisation",
    {
      address: "Flat 2 Fiona Overpass,City Simpsonfort,Huntbury,SA71 5BP",
      crn: "1100021396",
      email: "farmer@farm.com",
      farmerName: "John Jane Doe",
      name: "Willow Farm",
      orgEmail: "johndoe@gmail.com",
      sbi: "106354662",
    },
  );
  expect(res.statusCode).toBe(302);
  expect(res.headers.location).toBe("/check-details");
});

test("get /signin-oidc: application not approved", async () => {
  const server = await createServer();

  const rawState = {
    id: "344875ca-02ab-4a4e-a136-77b576569318",
    source: "dashboard",
  };
  const encodedState = Buffer.from(JSON.stringify(rawState)).toString("base64");

  const crn = "1100021396";
  const sbi = "106354662";
  const organisationId = "5501559";
  const nonce = "f0b70cd8-12a6-4e4e-a664-64bd7888b0d9";

  const state = {
    tokens: {
      nonce,
      state: encodedState,
    },
    pkcecodes: {
      verifier: "wsfnhWoz2TP5eg9n7-qLgr83XB4IJWUdZ9e6RZrlOTI",
    },
    customer: {
      crn,
    },
  };
  await setServerState(server, state);

  const { defraIdToken, acquireSigningKey, apimAccessToken } =
    commonAuthHandlers(crn, organisationId, nonce);

  const personId = "7357";
  const privilegeNames = ["Full permission - business"];
  const organisation = {
    id: organisationId,
    sbi,
  };
  const cphNumbers = [{ cphNumber: "29/004/0005" }];
  const {
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    getCphNumbers,
  } = commonRPAHandlers(personId, privilegeNames, organisation, cphNumbers);

  const { updateContactHistory } = commonApplicationHandlers();

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
          statusId: applicationStatus.IN_CHECK,
        },
      ]);
    },
  );

  mswServer.use(
    defraIdToken,
    acquireSigningKey,
    apimAccessToken,
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    updateContactHistory,
    getCphNumbers,
    getLatestApplicationsBySbi,
  );

  const res = await server.inject({
    url: `/signin-oidc?state=${encodedState}&code=123`,
  });

  expect(res.statusCode).toBe(302);
  expect(res.headers.location).toBe(
    `${config.applyServiceUri}/endemics/check-details`,
  );
});

test("get /signin-oidc: no eligible cph numbers", async () => {
  const server = await createServer();

  const rawState = {
    id: "344875ca-02ab-4a4e-a136-77b576569318",
    source: "dashboard",
  };
  const encodedState = Buffer.from(JSON.stringify(rawState)).toString("base64");

  const crn = "1100021396";
  const sbi = "106354662";
  const organisationId = "5501559";
  const nonce = "f0b70cd8-12a6-4e4e-a664-64bd7888b0d9";

  const state = {
    tokens: {
      nonce,
      state: encodedState,
    },
    pkcecodes: {
      verifier: "wsfnhWoz2TP5eg9n7-qLgr83XB4IJWUdZ9e6RZrlOTI",
    },
    customer: {
      crn,
    },
  };
  await setServerState(server, state);

  const { defraIdToken, acquireSigningKey, apimAccessToken } =
    commonAuthHandlers(crn, organisationId, nonce);

  const personId = "7357";
  const privilegeNames = ["Full permission - business"];
  const organisation = {
    id: organisationId,
    sbi,
  };
  const outsideEngland = 52;
  const cphNumbers = [{ cphNumber: `${outsideEngland}/004/0005` }];
  const {
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    getCphNumbers,
  } = commonRPAHandlers(personId, privilegeNames, organisation, cphNumbers);

  const { updateContactHistory } = commonApplicationHandlers();

  mswServer.use(
    defraIdToken,
    acquireSigningKey,
    apimAccessToken,
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    updateContactHistory,
    getCphNumbers,
  );

  const res = await server.inject({
    url: `/signin-oidc?state=${encodedState}&code=123`,
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

test("get /signin-oidc: no application, came from apply", async () => {
  const server = await createServer();

  const rawState = {
    id: "344875ca-02ab-4a4e-a136-77b576569318",
    source: "apply",
  };
  const encodedState = Buffer.from(JSON.stringify(rawState)).toString("base64");

  const crn = "1100021396";
  const sbi = "106354662";
  const organisationId = "5501559";
  const nonce = "f0b70cd8-12a6-4e4e-a664-64bd7888b0d9";

  const state = {
    tokens: {
      nonce,
      state: encodedState,
    },
    pkcecodes: {
      verifier: "wsfnhWoz2TP5eg9n7-qLgr83XB4IJWUdZ9e6RZrlOTI",
    },
    customer: {
      crn,
    },
  };
  await setServerState(server, state);

  const { defraIdToken, acquireSigningKey, apimAccessToken } =
    commonAuthHandlers(crn, organisationId, nonce);

  const personId = "7357";
  const privilegeNames = ["Full permission - business"];
  const organisation = {
    id: organisationId,
    sbi,
  };
  const cphNumbers = [{ cphNumber: "29/004/0005" }];
  const {
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    getCphNumbers,
  } = commonRPAHandlers(personId, privilegeNames, organisation, cphNumbers);

  const { updateContactHistory } = commonApplicationHandlers();

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

  mswServer.use(
    defraIdToken,
    acquireSigningKey,
    apimAccessToken,
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    updateContactHistory,
    getCphNumbers,
    getLatestApplicationsBySbi,
  );

  const res = await server.inject({
    url: `/signin-oidc?state=${encodedState}&code=123`,
  });

  expect(res.statusCode).toBe(302);
  expect(res.headers.location).toBe(
    `${config.applyServiceUri}/endemics/check-details`,
  );
});

test("get /signin-oidc: no application, came from dashboard", async () => {
  const server = await createServer();

  const rawState = {
    id: "344875ca-02ab-4a4e-a136-77b576569318",
    source: "dashboard",
  };
  const encodedState = Buffer.from(JSON.stringify(rawState)).toString("base64");

  const crn = "1100021396";
  const sbi = "106354662";
  const organisationId = "5501559";
  const nonce = "f0b70cd8-12a6-4e4e-a664-64bd7888b0d9";

  const state = {
    tokens: {
      nonce,
      state: encodedState,
    },
    pkcecodes: {
      verifier: "wsfnhWoz2TP5eg9n7-qLgr83XB4IJWUdZ9e6RZrlOTI",
    },
    customer: {
      crn,
    },
  };
  await setServerState(server, state);

  const { defraIdToken, acquireSigningKey, apimAccessToken } =
    commonAuthHandlers(crn, organisationId, nonce);

  const personId = "7357";
  const privilegeNames = ["Full permission - business"];
  const organisation = {
    id: organisationId,
    sbi,
  };
  const cphNumbers = [{ cphNumber: "29/004/0005" }];
  const {
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    getCphNumbers,
  } = commonRPAHandlers(personId, privilegeNames, organisation, cphNumbers);

  const { updateContactHistory } = commonApplicationHandlers();

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

  mswServer.use(
    defraIdToken,
    acquireSigningKey,
    apimAccessToken,
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    updateContactHistory,
    getCphNumbers,
    getLatestApplicationsBySbi,
  );

  const res = await server.inject({
    url: `/signin-oidc?state=${encodedState}&code=123`,
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

test("get /signin-oidc: closed old world application, came from apply", async () => {
  const server = await createServer();

  const rawState = {
    id: "344875ca-02ab-4a4e-a136-77b576569318",
    source: "apply",
  };
  const encodedState = Buffer.from(JSON.stringify(rawState)).toString("base64");

  const crn = "1100021396";
  const sbi = "106354662";
  const organisationId = "5501559";
  const nonce = "f0b70cd8-12a6-4e4e-a664-64bd7888b0d9";

  const state = {
    tokens: {
      nonce,
      state: encodedState,
    },
    pkcecodes: {
      verifier: "wsfnhWoz2TP5eg9n7-qLgr83XB4IJWUdZ9e6RZrlOTI",
    },
    customer: {
      crn,
    },
  };
  await setServerState(server, state);

  const { defraIdToken, acquireSigningKey, apimAccessToken } =
    commonAuthHandlers(crn, organisationId, nonce);

  const personId = "7357";
  const privilegeNames = ["Full permission - business"];
  const organisation = {
    id: organisationId,
    sbi,
  };
  const cphNumbers = [{ cphNumber: "29/004/0005" }];
  const {
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    getCphNumbers,
  } = commonRPAHandlers(personId, privilegeNames, organisation, cphNumbers);

  const { updateContactHistory } = commonApplicationHandlers();

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
          statusId: applicationStatus.NOT_AGREED,
        },
      ]);
    },
  );

  mswServer.use(
    defraIdToken,
    acquireSigningKey,
    apimAccessToken,
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    updateContactHistory,
    getCphNumbers,
    getLatestApplicationsBySbi,
  );

  const res = await server.inject({
    url: `/signin-oidc?state=${encodedState}&code=123`,
  });

  expect(res.statusCode).toBe(302);
  expect(res.headers.location).toBe(
    `${config.applyServiceUri}/endemics/check-details`,
  );
});

test("get /signin-oidc: open old world application, came from apply", async () => {
  const server = await createServer();

  const rawState = {
    id: "344875ca-02ab-4a4e-a136-77b576569318",
    source: "apply",
  };
  const encodedState = Buffer.from(JSON.stringify(rawState)).toString("base64");

  const crn = "1100021396";
  const sbi = "106354662";
  const organisationId = "5501559";
  const nonce = "f0b70cd8-12a6-4e4e-a664-64bd7888b0d9";

  const state = {
    tokens: {
      nonce,
      state: encodedState,
    },
    pkcecodes: {
      verifier: "wsfnhWoz2TP5eg9n7-qLgr83XB4IJWUdZ9e6RZrlOTI",
    },
    customer: {
      crn,
    },
  };
  setServerState(server, state);

  const { defraIdToken, acquireSigningKey, apimAccessToken } =
    commonAuthHandlers(crn, organisationId, nonce);

  const personId = "7357";
  const privilegeNames = ["Full permission - business"];
  const organisation = {
    id: organisationId,
    sbi,
  };
  const cphNumbers = [{ cphNumber: "29/004/0005" }];
  const {
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    getCphNumbers,
  } = commonRPAHandlers(personId, privilegeNames, organisation, cphNumbers);

  const { updateContactHistory } = commonApplicationHandlers();

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
        },
      ]);
    },
  );

  mswServer.use(
    defraIdToken,
    acquireSigningKey,
    apimAccessToken,
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    updateContactHistory,
    getCphNumbers,
    getLatestApplicationsBySbi,
  );

  const res = await server.inject({
    url: `/signin-oidc?state=${encodedState}&code=123`,
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

test("get /signin-oidc: open old world application, did not come from apply", async () => {
  const server = await createServer();

  const rawState = {
    id: "344875ca-02ab-4a4e-a136-77b576569318",
    source: "dashboard",
  };
  const encodedState = Buffer.from(JSON.stringify(rawState)).toString("base64");

  const crn = "1100021396";
  const sbi = "106354662";
  const organisationId = "5501559";
  const nonce = "f0b70cd8-12a6-4e4e-a664-64bd7888b0d9";

  const state = {
    tokens: {
      nonce,
      state: encodedState,
    },
    pkcecodes: {
      verifier: "wsfnhWoz2TP5eg9n7-qLgr83XB4IJWUdZ9e6RZrlOTI",
    },
    customer: {
      crn,
    },
  };
  setServerState(server, state);

  const { defraIdToken, acquireSigningKey, apimAccessToken } =
    commonAuthHandlers(crn, organisationId, nonce);

  const personId = "7357";
  const privilegeNames = ["Full permission - business"];
  const organisation = {
    id: organisationId,
    sbi,
  };
  const cphNumbers = [{ cphNumber: "29/004/0005" }];
  const {
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    getCphNumbers,
  } = commonRPAHandlers(personId, privilegeNames, organisation, cphNumbers);

  const { updateContactHistory } = commonApplicationHandlers();

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
        },
      ]);
    },
  );

  mswServer.use(
    defraIdToken,
    acquireSigningKey,
    apimAccessToken,
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    updateContactHistory,
    getCphNumbers,
    getLatestApplicationsBySbi,
  );

  const res = await server.inject({
    url: `/signin-oidc?state=${encodedState}&code=123`,
  });

  expect(res.statusCode).toBe(302);
  expect(res.headers.location).toMatch(
    `${config.claimServiceUri}/signin-oidc?state=${encodedState}&code=123`,
  );
});

test("get /signin-oidc: closed old world application, came from dashboard", async () => {
  const server = await createServer();

  const rawState = {
    id: "344875ca-02ab-4a4e-a136-77b576569318",
    source: "dashboard",
  };
  const encodedState = Buffer.from(JSON.stringify(rawState)).toString("base64");

  const crn = "1100021396";
  const sbi = "106354662";
  const organisationId = "5501559";
  const nonce = "f0b70cd8-12a6-4e4e-a664-64bd7888b0d9";

  const state = {
    tokens: {
      nonce,
      state: encodedState,
    },
    pkcecodes: {
      verifier: "wsfnhWoz2TP5eg9n7-qLgr83XB4IJWUdZ9e6RZrlOTI",
    },
    customer: {
      crn,
    },
  };
  await setServerState(server, state);

  const { defraIdToken, acquireSigningKey, apimAccessToken } =
    commonAuthHandlers(crn, organisationId, nonce);

  const personId = "7357";
  const privilegeNames = ["Full permission - business"];
  const organisation = {
    id: organisationId,
    sbi,
  };
  const cphNumbers = [{ cphNumber: "29/004/0005" }];
  const {
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    getCphNumbers,
  } = commonRPAHandlers(personId, privilegeNames, organisation, cphNumbers);

  const { updateContactHistory } = commonApplicationHandlers();

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
          statusId: applicationStatus.NOT_AGREED,
        },
      ]);
    },
  );

  mswServer.use(
    defraIdToken,
    acquireSigningKey,
    apimAccessToken,
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    updateContactHistory,
    getCphNumbers,
    getLatestApplicationsBySbi,
  );

  const res = await server.inject({
    url: `/signin-oidc?state=${encodedState}&code=123`,
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

test("get /signin-oidc: approved application, organisation locked", async () => {
  const server = await createServer();

  const rawState = {
    id: "344875ca-02ab-4a4e-a136-77b576569318",
    source: "dashboard",
  };
  const encodedState = Buffer.from(JSON.stringify(rawState)).toString("base64");

  const crn = "1100021396";
  const sbi = "106354662";
  const organisationId = "5501559";
  const nonce = "f0b70cd8-12a6-4e4e-a664-64bd7888b0d9";

  const state = {
    tokens: {
      nonce,
      state: encodedState,
    },
    pkcecodes: {
      verifier: "wsfnhWoz2TP5eg9n7-qLgr83XB4IJWUdZ9e6RZrlOTI",
    },
    customer: {
      crn,
    },
  };
  await setServerState(server, state);

  const { defraIdToken, acquireSigningKey, apimAccessToken } =
    commonAuthHandlers(crn, organisationId, nonce);

  const personId = "7357";
  const privilegeNames = ["Full permission - business"];
  const organisation = {
    id: organisationId,
    sbi,
    locked: true,
  };
  const cphNumbers = [{ cphNumber: "29/004/0005" }];
  const { getPersonSummary, getOrganisationAuthorisation, getOrganisation } =
    commonRPAHandlers(personId, privilegeNames, organisation, cphNumbers);

  const { updateContactHistory } = commonApplicationHandlers();

  mswServer.use(
    defraIdToken,
    acquireSigningKey,
    apimAccessToken,
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    updateContactHistory,
  );

  const res = await server.inject({
    url: `/signin-oidc?state=${encodedState}&code=123`,
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

test("get /signin-oidc: approved application, permission not available", async () => {
  const server = await createServer();

  const rawState = {
    id: "344875ca-02ab-4a4e-a136-77b576569318",
    source: "dashboard",
  };
  const encodedState = Buffer.from(JSON.stringify(rawState)).toString("base64");

  const crn = "1100021396";
  const sbi = "106354662";
  const organisationId = "5501559";
  const nonce = "f0b70cd8-12a6-4e4e-a664-64bd7888b0d9";

  const state = {
    tokens: {
      nonce,
      state: encodedState,
    },
    pkcecodes: {
      verifier: "wsfnhWoz2TP5eg9n7-qLgr83XB4IJWUdZ9e6RZrlOTI",
    },
    customer: {
      crn,
    },
  };
  await setServerState(server, state);

  const { defraIdToken, acquireSigningKey, apimAccessToken } =
    commonAuthHandlers(crn, organisationId, nonce);

  const personId = "7357";
  const privilegeNames = ["NO PRIVELIGES"];
  const organisation = {
    id: organisationId,
    sbi,
  };
  const cphNumbers = [{ cphNumber: "29/004/0005" }];
  const { getPersonSummary, getOrganisationAuthorisation, getOrganisation } =
    commonRPAHandlers(personId, privilegeNames, organisation, cphNumbers);

  const { updateContactHistory } = commonApplicationHandlers();

  mswServer.use(
    defraIdToken,
    acquireSigningKey,
    apimAccessToken,
    getPersonSummary,
    getOrganisationAuthorisation,
    getOrganisation,
    updateContactHistory,
  );

  const res = await server.inject({
    url: `/signin-oidc?state=${encodedState}&code=123`,
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

test("get /signin-oidc: mismatching state", async () => {
  const { defraId } = authConfig;
  const server = await createServer();

  const rawServerState = {
    id: "6ec6125f-dcbc-45f2-b042-7db263ff89fd",
    source: "dashboard",
  };
  const encodedServerState = Buffer.from(
    JSON.stringify(rawServerState),
  ).toString("base64");

  const state = {
    tokens: {
      state: encodedServerState,
    },
  };

  const rawClientState = {
    id: "e994b116-e505-4fcd-a2ac-1810d9cc3db7",
    source: "dashboard",
  };
  const encodedClientState = Buffer.from(
    JSON.stringify(rawClientState),
  ).toString("base64");
  await setServerState(server, state);

  const res = await server.inject({
    url: `/signin-oidc?state=${encodedClientState}&code=0`,
  });

  expect(res.statusCode).toBe(302);
  expect(res.headers.location.href).toMatch(
    `${defraId.hostname}${defraId.oAuthAuthorisePath}`,
  );
});

test("get /signin-oidc: missing query", async () => {
  const server = await createServer();

  const res = await server.inject({
    url: "/signin-oidc",
  });

  globalJsdom(res.payload);
  expect(res.statusCode).toBe(400);

  expect(
    getByRole(document.body, "heading", { level: 1, name: "Login failed" }),
  ).toBeDefined();
});

test("get /signin-oidc: unexpected error", async () => {
  const server = await createServer();

  const res = await server.inject({
    url: "/signin-oidc?state=badState&code=000",
  });

  globalJsdom(res.payload);
  expect(res.statusCode).toBe(400);

  expect(
    getByRole(document.body, "heading", { level: 1, name: "Login failed" }),
  ).toBeDefined();
});
