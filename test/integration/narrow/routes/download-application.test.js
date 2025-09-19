import { setServerState } from "../../../helpers/set-server-state.js";
import { createServer } from "../../../../app/server.js";
import { storageConfig } from "../../../../app/config/storage.js";
import { StatusCodes } from "http-status-codes";

jest.mock("../../../../app/constants/claim-statuses.js", () => ({
  closedViewStatuses: [2, 10, 7, 9]
}));

test("get /download-application", async () => {
  const server = await createServer();

  jest.replaceProperty(storageConfig, "useConnectionString", false);

  const sbi = "106354662";
  const reference = "RESH-A89F-7776";
  const state = {
    endemicsClaim: {
      organisation: {
        sbi,
      },
      LatestEndemicsApplicationReference: reference,
    },
  };

  await setServerState(server, state);

  const res = await server.inject({
    url: `/download-application/${sbi}/${reference}`,
    auth: {
      credentials: {},
      strategy: "cookie",
    },
  });

  expect(res.payload).toBe(`${sbi}/${reference}.pdf`);
});

test("get /download-application, reference mismatch", async () => {
  const server = await createServer();

  const sbi = "106354662";
  const LatestEndemicsApplicationReference = "RESH-A101-1111";
  const reference = "RESH-A202-2222";
  const state = {
    endemicsClaim: {
      organisation: {
        sbi,
      },
      LatestEndemicsApplicationReference,
    },
  };

  await setServerState(server, state);

  const res = await server.inject({
    url: `/download-application/${sbi}/${reference}`,
    auth: {
      credentials: {},
      strategy: "cookie",
    },
  });

  expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
});

test("get /download-application, sbi mismatch", async () => {
  const server = await createServer();

  const sbi = "123456789";
  const organisationSbi = "111111111";
  const reference = "RESH-A303-3333";
  const state = {
    endemicsClaim: {
      organisation: {
        sbi: organisationSbi,
      },
      LatestEndemicsApplicationReference: reference,
    },
  };

  await setServerState(server, state);

  const res = await server.inject({
    url: `/download-application/${sbi}/${reference}`,
    auth: {
      credentials: {},
      strategy: "cookie",
    },
  });

  expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
});
