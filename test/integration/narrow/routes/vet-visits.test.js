import { setServerState } from "../../../helpers/set-server-state.js";
import { config } from "../../../../app/config/index.js";
import { createServer } from "../../../../app/server";
import { getTableCells } from "../../../helpers/get-table-cells.js";
import { setupServer } from "msw/node";
import globalJsdom from "global-jsdom";
import { getByRole, queryByRole } from "@testing-library/dom";
import { http, HttpResponse } from "msw";
import { authConfig } from "../../../../app/config/auth.js";

let cleanUpFunction;

const nunJucksInternalTimerMethods = ["nextTick"];

const mswServer = setupServer();
mswServer.listen();

afterEach(() => {
  mswServer.resetHandlers();
});

afterAll(() => {
  mswServer.close();
});

test("get /vet-visits: new world, multiple businesses", async () => {
  config.multiHerds.enabled = false;
  const server = await createServer();

  const sbi = "106354662";
  const state = {
    customer: {
      attachedToMultipleBusinesses: true,
    },
    endemicsClaim: {
      organisation: {
        sbi,
        name: "PARTRIDGES",
        farmerName: "Janice Harrison",
      },
    },
  };

  await setServerState(server, state);

  const applicationReference = "AHWR-TEST-NEW1";
  const newWorldApplications = [
    {
      sbi,
      type: "EE",
      reference: applicationReference,
    },
  ];
  const applicationsLatest = http.get(
    `${config.applicationApi.uri}/applications/latest`,
    () => HttpResponse.json(newWorldApplications)
  );

  const claims = [
    {
      applicationReference,
      reference: "RESH-A89F-7776",
      data: {
        dateOfVisit: "2024-12-29",
        typeOfLivestock: "beef",
        claimType: "R",
      },
      statusId: "2",
    },
  ];
  const claimByReference = http.get(
    `${config.applicationApi.uri}/claim/get-by-application-reference/${applicationReference}`,
    () => HttpResponse.json(claims)
  );

  mswServer.use(applicationsLatest, claimByReference);

  const { payload } = await server.inject({
    url: "/vet-visits",
    auth: {
      credentials: {},
      strategy: "cookie",
    },
  });
  cleanUpFunction = globalJsdom(payload);

  expect(queryByRole(document.body, "region", { name: "Important" })).toBe(
    null
  );

  expect(getTableCells(document.body)).toEqual([
    ["Visit date", "Species", "Type", "Claim number", "Status"],
    [
      "29 December 2024",
      "Beef cattle",
      "Review",
      "RESH-A89F-7776",
      "Withdrawn",
    ],
  ]);

  expect(
    getByRole(document.body, "link", { name: "agreement summary" })
  ).toHaveProperty(
    "href",
    `${document.location.href}download-application/${sbi}/${applicationReference}`
  );

  expect(
    getByRole(document.body, "button", { name: "Start a new claim" })
  ).toHaveProperty(
    "href",
    `${config.claimServiceUri}/endemics?from=dashboard&sbi=${sbi}`
  );

  expect(
    getByRole(document.body, "link", {
      name: "Claim for a different business",
    })
  ).toHaveProperty(
    "href",
    expect.stringContaining(authConfig.defraId.hostname)
  );
});

test("get /vet-visits: new world, no claims made, show banner", async () => {
  cleanUpFunction();
  config.multiHerds.enabled = false;
  const server = await createServer();
  jest.replaceProperty(config.multiSpecies, "releaseDate", "2024-12-04");

  const sbi = "123123123";
  const state = {
    customer: {
      attachedToMultipleBusinesses: true,
    },
    endemicsClaim: {
      organisation: {
        sbi,
        name: "TEST FARM",
        farmerName: "Farmer Joe",
      },
    },
  };

  await setServerState(server, state);

  const beforeMultiSpeciesReleaseDate = "2024-12-03";
  const newWorldApplications = [
    {
      sbi,
      type: "EE",
      reference: "AHWR-TEST-NEW2",
      createdAt: beforeMultiSpeciesReleaseDate,
    },
  ];
  const applicationsLatest = http.get(
    `${config.applicationApi.uri}/applications/latest`,
    () => HttpResponse.json(newWorldApplications)
  );

  const claimByReference = http.get(
    `${config.applicationApi.uri}/claim/get-by-application-reference/AHWR-TEST-NEW2`,
    () => HttpResponse.json([])
  );

  mswServer.use(applicationsLatest, claimByReference);

  const { payload } = await server.inject({
    url: "/vet-visits",
    auth: {
      credentials: {},
      strategy: "cookie",
    },
  });
  cleanUpFunction = globalJsdom(payload);

  const banner = getByRole(document.body, "region", { name: "Important" });
  expect(getByRole(banner, "paragraph").textContent.trim()).toBe(
    "You can now claim for more than one species."
  );
});

test("get /vet-visits: old world application only", async () => {
  cleanUpFunction();
  config.multiHerds.enabled = false;
  const server = await createServer();
  const timeOfTest = new Date("2025-01-02");

  jest
    .useFakeTimers({ doNotFake: nunJucksInternalTimerMethods })
    .setSystemTime(timeOfTest);

  const state = {
    customer: {
      attachedToMultipleBusinesses: false,
    },
    endemicsClaim: {
      organisation: {
        sbi: "106354662",
        name: "PARTRIDGES",
        farmerName: "Janice Harrison",
      },
    },
  };

  await setServerState(server, state);

  const sbi = "106354662";
  const almostTenMonthsBefore = new Date("2024-03-03");

  const oldWorldApplications = [
    {
      sbi,
      type: "VV",
      reference: "AHWR-TEST-OLD1",
      data: {
        visitDate: almostTenMonthsBefore,
        whichReview: "dairy",
      },
      statusId: "5",
    },
  ];
  const applicationsLatest = http.get(
    `${config.applicationApi.uri}/applications/latest`,
    () => HttpResponse.json(oldWorldApplications)
  );

  mswServer.use(applicationsLatest);

  const { payload } = await server.inject({
    url: "/vet-visits",
    auth: {
      credentials: {},
      strategy: "cookie",
    },
  });
  jest.useRealTimers();
  globalJsdom(payload);

  expect(queryByRole(document.body, "region", { name: "Important" })).toBe(
    null
  );

  expect(getTableCells(document.body)).toEqual([
    ["Visit date", "Species", "Type", "Claim number", "Status"],
    ["3 March 2024", "Dairy cattle", "Review", "AHWR-TEST-OLD1", "Submitted"],
  ]);
});
