import { setServerState } from "../../../helpers/set-server-state.js";
import { createServer } from "../../../../app/server.js";
import { storageConfig } from "../../../../app/config/storage.js";
import globalJsdom from "global-jsdom";
import { getByRole } from "@testing-library/dom";

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

  globalJsdom(res.payload);

  expect(res.statusCode).toBe(404);
  expect(
    getByRole(document.body, "heading", { level: 1, name: "404 - Not Found" }),
  ).toBeDefined();
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

  globalJsdom(res.payload);

  expect(res.statusCode).toBe(404);
  expect(
    getByRole(document.body, "heading", { level: 1, name: "404 - Not Found" }),
  ).toBeDefined();
});
