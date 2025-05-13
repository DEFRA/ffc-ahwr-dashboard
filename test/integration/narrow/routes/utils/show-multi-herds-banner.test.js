import { showMultiHerdsBanner } from "../../../../../app/routes/utils/show-multi-herds-banner";
import { config } from "../../../../../app/config/index.js";

const { multiHerds } = config;

jest.mock("../../../../../app/config/index");
multiHerds.enabled = true;
beforeEach(() => {
  jest.resetAllMocks();
});

test("no applications", () => {
  const applications = [];
  const claims = [];

  const result = showMultiHerdsBanner(applications, claims);

  expect(result).toBe(false);
});

test("applied before, no claims", () => {
  jest.replaceProperty(multiHerds, "releaseDate", "2024-12-04");

  const applications = [{ createdAt: "2024-12-03" }];
  const claims = [];

  const result = showMultiHerdsBanner(applications, claims);

  expect(result).toBe(true);
});

test("applied before, claimed before", () => {
  jest.replaceProperty(multiHerds, "releaseDate", "2024-12-04");

  const applications = [{ createdAt: "2024-12-03" }];
  const claims = [{ createdAt: "2024-12-03" }];

  const result = showMultiHerdsBanner(applications, claims);

  expect(result).toBe(true);
});

test("applied before, claimed after", () => {
  jest.replaceProperty(multiHerds, "releaseDate", "2024-12-04");

  const applications = [{ createdAt: "2024-12-03" }];
  const claims = [{ createdAt: "2024-12-05" }];

  const result = showMultiHerdsBanner(applications, claims);

  expect(result).toBe(false);
});

test("applied after", () => {
  jest.replaceProperty(multiHerds, "releaseDate", "2024-12-04");

  const applications = [{ createdAt: "2024-12-05" }];
  const claims = [];

  const result = showMultiHerdsBanner(applications, claims);

  expect(result).toBe(false);
});

test("applied before, no claims, but MH is disabled", () => {
  multiHerds.enabled = false;
  jest.replaceProperty(multiHerds, "releaseDate", "2024-12-04");

  const applications = [{ createdAt: "2024-12-03" }];
  const claims = [];

  const result = showMultiHerdsBanner(applications, claims);

  expect(result).toBe(false);
});
