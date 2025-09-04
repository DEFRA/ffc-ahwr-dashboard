import { createServer } from "../../../../app/server.js";
import globalJsdom from "global-jsdom";
import { getAllByRole, getByRole } from "@testing-library/dom";
import { getCrumb, getCrumbFromSetCookie } from "../../../helpers/get-crumb";
import { setServerState } from "../../../helpers/set-server-state";
import { captureFormData } from "../../../helpers/capture-form-data";
import { userEvent } from "@testing-library/user-event";

jest.mock("../../../../app/constants/claim-statuses.js", () => ({
  closedViewStatuses: [2, 10, 7, 9]
}));

let cleanUpFunction;

test("get /check-details", async () => {
  const server = await createServer();

  const state = {
    customer: {
      crn: "1100021396",
      organisationId: "5501559",
      attachedToMultipleBusinesses: false,
      id: 5002139,
    },
    endemicsClaim: {
      organisation: {
        crn: "1100021396",
        frn: "1101540710",
        sbi: "106354662",
        name: "PARTRIDGES",
        email: "janiceharrisono@nosirrahecinajt.com.test",
        address:
          "Thomanean, Old Great North Road, WILLYS AT HEATH, DERBY, NE5 3HE, United Kingdom",
        orgEmail: "partridgesi@segdirtrapu.com.test",
        userType: "newUser",
        farmerName: "Janice Harrison",
      },
    },
  };

  await setServerState(server, state);

  const res = await server.inject({
    url: "/check-details",
    auth: {
      credentials: {},
      strategy: "cookie",
    },
  });

  cleanUpFunction = globalJsdom(res.payload);

  const { crumb } = getCrumbFromSetCookie(res.headers["set-cookie"]);
  const user = userEvent.setup({ document });
  const { formdata } = captureFormData();

  const rows = getAllByRole(document.body, "definition").map((row) =>
    row.textContent.trim(),
  );

  expect(rows).toEqual([
    "Janice Harrison",
    "PARTRIDGES",
    "1100021396",
    "106354662",
    "partridgesi@segdirtrapu.com.test",
    "janiceharrisono@nosirrahecinajt.com.test",
    "Thomanean Old Great North Road WILLYS AT HEATH DERBY NE5 3HE United Kingdom",
  ]);

  const no = getByRole(document.body, "radio", { name: "No" });
  const yes = getByRole(document.body, "radio", { name: "Yes" });
  const submit = getByRole(document.body, "button", { name: "Continue" });

  await user.click(submit);
  expect(formdata()).toEqual({
    crumb,
  });

  await user.click(no);
  await user.click(submit);
  expect(formdata()).toEqual({
    crumb,
    confirmCheckDetails: "no",
  });

  await user.click(yes);
  await user.click(submit);
  expect(formdata()).toEqual({
    crumb,
    confirmCheckDetails: "yes",
  });
});

test("get /check-details: organisation not found", async () => {
  cleanUpFunction();
  const server = await createServer();

  const res = await server.inject({
    url: "/check-details",
    auth: {
      credentials: {},
      strategy: "cookie",
    },
  });

  cleanUpFunction = globalJsdom(res.payload);

  expect(res.statusCode).toBe(404);
});

test("post /check-details: confirmed yes", async () => {
  const server = await createServer();
  const { crumb } = await getCrumb(server, "/check-details");

  const res = await server.inject({
    url: "/check-details",
    method: "post",
    auth: {
      credentials: {},
      strategy: "cookie",
    },
    headers: { cookie: `crumb=${crumb}` },
    payload: {
      crumb,
      confirmCheckDetails: "yes",
    },
  });

  expect(res.statusCode).toBe(302);
  expect(res.headers.location).toBe("/vet-visits");
});

test("post /check-details: confirmed no", async () => {
  cleanUpFunction();
  const server = await createServer();
  const { crumb } = await getCrumb(server, "/check-details");

  const res = await server.inject({
    url: "/check-details",
    method: "post",
    auth: {
      credentials: {},
      strategy: "cookie",
    },
    headers: { cookie: `crumb=${crumb}` },
    payload: {
      crumb,
      confirmCheckDetails: "no",
    },
  });

  globalJsdom(res.payload);

  getByRole(document.body, "heading", {
    level: 1,
    name: "Update your details",
  });
});

test("post /check-details: invalid input", async () => {
  const server = await createServer();
  const { crumb } = await getCrumb(server, "/check-details");
  const state = {
    customer: {},
    endemicsClaim: {
      organisation: {},
    },
  };

  await setServerState(server, state);

  const res = await server.inject({
    url: "/check-details",
    method: "post",
    auth: {
      credentials: {},
      strategy: "cookie",
    },
    headers: { cookie: `crumb=${crumb}` },
    payload: {
      crumb,
    },
  });

  expect(res.statusCode).toBe(400);
});

test("post /check-details: invalid input and no organisation in state", async () => {
  const server = await createServer();
  const { crumb } = await getCrumb(server, "/check-details");

  const res = await server.inject({
    url: "/check-details",
    method: "post",
    auth: {
      credentials: {},
      strategy: "cookie",
    },
    headers: { cookie: `crumb=${crumb}` },
    payload: {
      crumb,
    },
  });

  expect(res.statusCode).toBe(404);
});
