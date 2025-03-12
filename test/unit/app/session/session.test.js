import * as session from "../../../../app/session/index.js";
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
  describe("lacksAny", () => {
    test("correct entryKey and correct key", () => {
      const request = { yar: yarMock };
      const entryKey = "entryKey";
      const keys = ["key1", "key2"];
      expect(session.lacksAny(request, entryKey, keys)).toEqual(false);
    });

    test("incorrect entry key and correct key", () => {
      const request = { yar: yarMock };
      const entryKey = "false entryKey";
      const keys = ["key1", "key2"];
      expect(session.lacksAny(request, entryKey, keys)).toEqual(true);
    });

    test("correct entry key and incorrect key", () => {
      const request = { yar: yarMock };
      const entryKey = "entryKey";
      const keys = ["key1", "false key"];
      expect(session.lacksAny(request, entryKey, keys)).toEqual(true);
    });

    test("correct entry key and undefined key", () => {
      const request = { yar: yarMock };
      const entryKey = "entryKey";
      const keys = [undefined];
      expect(session.lacksAny(request, entryKey, keys)).toEqual(false);
    });

    test("incorrect entry key and undefined key", () => {
      const request = { yar: yarMock };
      const entryKey = "false entryKey";
      const keys = [undefined];
      expect(session.lacksAny(request, entryKey, keys)).toEqual(true);
    });
  });

  describe("clear", () => {
    test("yar.clear is called for all entries excluding tokens and pkcecodes", () => {
      const request = { yar: yarMock };
      session.clear(request);

      const entriesToClear = Object.values(session.entries).filter(
        (v) => v !== "tokens" && v !== "pkcecodes",
      );
      expect(yarMock.clear).toHaveBeenCalledTimes(entriesToClear.length);
      entriesToClear.forEach((entryToClear) => {
        expect(yarMock.clear).toHaveBeenCalledWith(entryToClear);
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
      session.setApplication(request, "test key", 123);
      expect(yarMock.set).toHaveBeenCalledWith("application", {
        "test key": 123,
      });
      expect(sendSessionEvent).toHaveBeenCalledWith(
        undefined,
        1,
        "application",
        "test key",
        123,
        "123",
      );
    });

    test("Send session event called with correct variables - header", () => {
      const request = {
        yar: yarMock,
        headers: { "x-forwarded-for": "1,2,3" },
        info: { remoteAddress: "123" },
      };
      session.setApplication(request, "test key", 123);
      expect(yarMock.set).toHaveBeenCalledWith("application", {
        "test key": 123,
      });
      expect(sendSessionEvent).toHaveBeenCalledWith(
        undefined,
        1,
        "application",
        "test key",
        123,
        "1",
      );
    });
  });

  describe("Application", () => {
    test("set called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      session.setApplication(request, "test key", "test value");
      expect(yarMock.set).toHaveBeenCalledWith("application", {
        "test key": "test value",
      });
    });

    test("get called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      session.getApplication(request, "test key");
      expect(yarMock.get).toHaveBeenCalledWith("application");
    });
  });

  describe("EndemicsClaim", () => {
    test("set called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      session.setEndemicsClaim(request, "test key", "test value");
      expect(yarMock.set).toHaveBeenCalledWith("endemicsClaim", {
        "test key": "test value",
      });
    });

    test("get called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      session.getEndemicsClaim(request, "test key");
      expect(yarMock.get).toHaveBeenCalledWith("endemicsClaim");
    });
  });

  describe("FarmerApplyData", () => {
    test("set called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      session.setFarmerApplyData(request, "test key", "test value");
      expect(yarMock.set).toHaveBeenCalledWith("farmerApplyData", {
        "test key": "test value",
      });
    });

    test("get called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      session.getFarmerApplyData(request, "test key");
      expect(yarMock.get).toHaveBeenCalledWith("farmerApplyData");
    });
  });

  describe("SelectYourBusiness", () => {
    test("set called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      session.setSelectYourBusiness(request, "test key", "test value");
      expect(yarMock.set).toHaveBeenCalledWith("selectYourBusiness", {
        "test key": "test value",
      });
    });

    test("get called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      session.getSelectYourBusiness(request, "test key");
      expect(yarMock.get).toHaveBeenCalledWith("selectYourBusiness");
    });
  });

  describe("Token", () => {
    test("set called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      session.setToken(request, "test key", 123);
      expect(yarMock.set).toHaveBeenCalledWith("tokens", { "test key": 123 });
    });

    test("get called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      session.getToken(request, "test key");
      expect(yarMock.get).toHaveBeenCalledWith("tokens");
    });
  });

  describe("Pkcecodes", () => {
    test("set called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      session.setPkcecodes(request, "test key", "test value");
      expect(yarMock.set).toHaveBeenCalledWith("pkcecodes", {
        "test key": "test value",
      });
    });

    test("get called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      session.getPkcecodes(request, "test key");
      expect(yarMock.get).toHaveBeenCalledWith("pkcecodes");
    });
  });

  describe("Customer", () => {
    test("set called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      session.setCustomer(request, "test key", "test value");
      expect(yarMock.set).toHaveBeenCalledWith("customer", {
        "test key": "test value",
      });
    });

    test("get called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      session.getCustomer(request, "test key");
      expect(yarMock.get).toHaveBeenCalledWith("customer");
    });
  });

  describe("ReturnRoute", () => {
    test("set called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      session.setReturnRoute(request, "setReturnRoute", "test value");
      expect(yarMock.set).toHaveBeenCalledWith("returnRoute", {
        setReturnRoute: "test value",
      });
    });

    test("get called with correct variables", () => {
      const request = { yar: yarMock, headers: { "x-forwarded-for": "1,2,3" } };
      session.getReturnRoute(request);
      expect(yarMock.get).toHaveBeenCalledWith("returnRoute");
    });
  });
});
