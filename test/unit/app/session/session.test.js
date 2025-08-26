import {
  clear,
  clearAllOfSession,
  entries,
  getApplication,
  getCustomer,
  getEndemicsClaim,
  getFarmerApplyData,
  getPkcecodes,
  getReturnRoute,
  getToken,
  setApplication,
  setCustomer,
  setEndemicsClaim,
  setFarmerApplyData,
  setPkcecodes,
  setReturnRoute,
  setToken,
} from "../../../../app/session/index.js";
import { sendSessionEvent } from "../../../../app/event/send-session-event.js";

jest.mock("../../../../app/event/send-session-event");

const yarMock = {
  id: 1,
  get: jest.fn((entryKey) => {
    if (entryKey === "entryKey") {
      return { key1: 123, key2: 123 };
    }
  }),
  set: jest.fn(),
  clear: jest.fn(),
};

describe("session", () => {

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("clear", () => {
    test("yar.clear is called for all entries excluding tokens and pkcecodes", () => {
      const request = { yar: yarMock };
      clear(request);

      const entriesToClear = Object.values(entries).filter(
        (v) => v !== "tokens" && v !== "pkcecodes"
      );
      expect(yarMock.clear).toHaveBeenCalledTimes(entriesToClear.length);
      entriesToClear.forEach((entryToClear) => {
        expect(yarMock.clear).toHaveBeenCalledWith(entryToClear);
      });
    });
  });

  describe("clearAllOfSession", () => {
    test("yar.clear is called for all entries (no exclusions)", () => {
      const request = { yar: yarMock };
      clearAllOfSession(request);

      const entryKeyValuePairs = Object.entries(entries);
      expect(yarMock.clear).toHaveBeenCalledTimes(entryKeyValuePairs.length);

      entryKeyValuePairs.forEach(([key, value]) => {
        expect(yarMock.clear).toHaveBeenCalledWith(value);
      });
    });
  });

  describe("Set", () => {
    test("Send session event called with correct variables - no header", () => {
      const request = {
        yar: yarMock,
        headers: {},
        info: { remoteAddress: "123" },
      };
      setApplication(request, "test key", 123);
      expect(yarMock.set).toHaveBeenCalledWith("application", {
        "test key": 123,
      });
      expect(sendSessionEvent).toHaveBeenCalledWith(
        undefined,
        1,
        "application",
        "test key",
        123,
        "123"
      );
    });

    test("Send session event called with correct variables - header", () => {
      const request = {
        yar: yarMock,
        headers: { "x-forwarded-for": "1,2,3" },
        info: { remoteAddress: "123" },
      };
      setApplication(request, "test key", 123);
      expect(yarMock.set).toHaveBeenCalledWith("application", {
        "test key": 123,
      });
      expect(sendSessionEvent).toHaveBeenCalledWith(
        undefined,
        1,
        "application",
        "test key",
        123,
        "1"
      );
    });
  });

  describe("Application", () => {
    test("set called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      setApplication(request, "test key", "test value");
      expect(yarMock.set).toHaveBeenCalledWith("application", {
        "test key": "test value",
      });
    });

    test("get called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      getApplication(request, "test key");
      expect(yarMock.get).toHaveBeenCalledWith("application");
    });
  });

  describe("EndemicsClaim", () => {
    test("set called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      setEndemicsClaim(request, "test key", "test value");
      expect(yarMock.set).toHaveBeenCalledWith("endemicsClaim", {
        "test key": "test value",
      });
    });

    test("get called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      getEndemicsClaim(request, "test key");
      expect(yarMock.get).toHaveBeenCalledWith("endemicsClaim");
    });
  });

  describe("FarmerApplyData", () => {
    test("set called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      setFarmerApplyData(request, "test key", "test value");
      expect(yarMock.set).toHaveBeenCalledWith("farmerApplyData", {
        "test key": "test value",
      });
    });

    test("get called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      getFarmerApplyData(request, "test key");
      expect(yarMock.get).toHaveBeenCalledWith("farmerApplyData");
    });
  });

  describe("Token", () => {
    test("set called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      setToken(request, "test key", 123);
      expect(yarMock.set).toHaveBeenCalledWith("tokens", { "test key": 123 });
    });

    test("get called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      getToken(request, "test key");
      expect(yarMock.get).toHaveBeenCalledWith("tokens");
    });
  });

  describe("Pkcecodes", () => {
    test("set called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      setPkcecodes(request, "test key", "test value");
      expect(yarMock.set).toHaveBeenCalledWith("pkcecodes", {
        "test key": "test value",
      });
    });

    test("get called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      getPkcecodes(request, "test key");
      expect(yarMock.get).toHaveBeenCalledWith("pkcecodes");
    });
  });

  describe("Customer", () => {
    test("set called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      setCustomer(request, "test key", "test value");
      expect(yarMock.set).toHaveBeenCalledWith("customer", {
        "test key": "test value",
      });
    });

    test("get called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      getCustomer(request, "test key");
      expect(yarMock.get).toHaveBeenCalledWith("customer");
    });
  });

  describe("ReturnRoute", () => {
    test("set called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      setReturnRoute(request, "setReturnRoute", "test value");
      expect(yarMock.set).toHaveBeenCalledWith("returnRoute", {
        setReturnRoute: "test value",
      });
    });

    test("get called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      getReturnRoute(request);
      expect(yarMock.get).toHaveBeenCalledWith("returnRoute");
    });
  });
});
