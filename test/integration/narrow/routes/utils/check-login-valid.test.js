import { checkLoginValid } from "../../../../../app/routes/utils/check-login-valid";
import { getCustomer, setSignInRedirect } from "../../../../../app/session";
import { sessionKeys } from "../../../../../app/session/keys";
import { customerHasAtLeastOneValidCph } from "../../../../../app/api-requests/rpa-api/cph-check";
import { raiseIneligibilityEvent } from "../../../../../app/event/raise-ineligibility-event";
import { requestAuthorizationCodeUrl } from "../../../../../app/auth/auth-code-grant/request-authorization-code-url";
import { getLatestApplicationsBySbi } from "../../../../../app/api-requests/application-api";

jest.mock("applicationinsights", () => ({
  defaultClient: { trackEvent: jest.fn() },
}));

jest.mock("../../../../../app/constants/claim-statuses.js", () => ({
  closedViewStatuses: [2, 10, 7, 9],
  CLAIM_STATUSES: {
    AGREED: 1,
    WITHDRAWN: 2,
    IN_CHECK: 5,
    ACCEPTED: 6,
    NOT_AGREED: 7,
    PAID: 8,
    READY_TO_PAY: 9,
    REJECTED: 10,
    ON_HOLD: 11,
    RECOMMENDED_TO_PAY: 12,
    RECOMMENDED_TO_REJECT: 13,
    AUTHORISED: 14,
    SENT_TO_FINANCE: 15,
    PAYMENT_HELD: 16
  }
}));

jest.mock("../../../../../app/session", () => ({
  getCustomer: jest.fn().mockReturnValue(124),
  setCannotSignInDetails: jest.fn(),
  setSignInRedirect: jest.fn()
}));

jest.mock("../../../../../app/api-requests/rpa-api/cph-check", () => ({
  customerHasAtLeastOneValidCph: jest.fn().mockResolvedValue(true),
}));

jest.mock("../../../../../app/api-requests/application-api", () => ({
  getLatestApplicationsBySbi: jest.fn().mockResolvedValue([
    {
      type: "EE",
      statusId: 9,
      createdAt: new Date(),
    },
  ]),
}));

jest.mock("../../../../../app/event/raise-ineligibility-event");

jest.mock(
  "../../../../../app/auth/auth-code-grant/request-authorization-code-url",
  () => ({
    requestAuthorizationCodeUrl: jest.fn().mockReturnValue("back link"),
  })
);

describe("checkLoginValid", () => {

  const cphNumbers = ["33/333/3333"];
  const personSummary = {
    id: 12345,
    name: "Farmer Tom",
    email: "farmertomstestemail@test.com.test",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("it returns a redirect path if the user is eligible to login", async () => {
    const h = {};
    const organisation = {
      address:
        "1 Brown Lane,Smithering,West Sussex,England,UK,Thompsons,Sisterdene,1-30,Grey Building,Brown Lane,Grenwald,West Sussex,WS11 2DS,GBR",
      email: "unit@test.email.com.test",
      name: "Unit test org",
      sbi: 999000,
    };
    const organisationPermission = true;

    const mockSetBindings = jest.fn();

    const request = {
      yar: {
        id: 1,
      },
      logger: {
        setBindings: mockSetBindings,
      },
    };

    const result = await checkLoginValid({
      h,
      organisation,
      organisationPermission,
      request,
      cphNumbers,
      personSummary,
    });

    expect(result.redirectPath).toEqual("/check-details");
    expect(result.redirectCallback).toBeNull();
    expect(getCustomer).toHaveBeenCalledWith(request, sessionKeys.customer.crn);
    expect(setSignInRedirect).toHaveBeenCalledWith(request, sessionKeys.signInRedirect, true);
    expect(customerHasAtLeastOneValidCph).toHaveBeenCalledWith(cphNumbers);
    expect(mockSetBindings).not.toHaveBeenCalled();
  });

  test("it returns a redirect callback if the user's organisation is locked", async () => {
    const mockRedirectCallBackAsString = "im a redirect callback";
    const h = {
      redirect: jest
        .fn()
        .mockReturnValue({
          takeover: jest.fn().mockReturnValue(mockRedirectCallBackAsString),
        }),
    };
    const organisation = {
      address: "1 Brown Lane,Smithering,West Sussex,England,UK,Thompsons,Sisterdene,1-30,Grey Building,Brown Lane,Grenwald,West Sussex,WS11 2DS,GBR",
      email: "unit@test.email.com.test",
      name: "Unit test org",
      sbi: 999000,
      locked: true,
      id: 111
    };
    const organisationPermission = true;

    const mockSetBindings = jest.fn();

    const request = {
      yar: {
        id: 1,
      },
      logger: {
        setBindings: mockSetBindings,
      },
    };

    const result = await checkLoginValid({
      h,
      organisation,
      organisationPermission,
      request,
      cphNumbers,
      personSummary,
    });

    expect(result).toEqual({
      redirectPath: null,
      redirectCallback: mockRedirectCallBackAsString,
    });
    expect(getCustomer).toHaveBeenCalledWith(request, sessionKeys.customer.crn);
    expect(setSignInRedirect).not.toHaveBeenCalled();
    expect(customerHasAtLeastOneValidCph).not.toHaveBeenCalled(); // only gets called if an error hasnt been found yet
    expect(mockSetBindings).toHaveBeenCalledWith({ crn: 124, error: "Organisation id 111 is locked by RPA" });
    expect(raiseIneligibilityEvent).toHaveBeenCalledWith(
      request.yar.id,
      organisation.sbi,
      124,
      organisation.email,
      "LockedBusinessError"
    );
    expect(requestAuthorizationCodeUrl).toHaveBeenCalledWith(request);
  });

  test("it returns a redirect callback if there is no organisation permission", async () => {
    const mockRedirectCallBackAsString = "im a redirect callback";
    const h = {
      redirect: jest
        .fn()
        .mockReturnValue({
          takeover: jest.fn().mockReturnValue(mockRedirectCallBackAsString),
        }),
    };
    const organisation = {
      address: "1 Brown Lane,Smithering,West Sussex,England,UK,Thompsons,Sisterdene,1-30,Grey Building,Brown Lane,Grenwald,West Sussex,WS11 2DS,GBR",
      email: "unit@test.email.com.test",
      name: "Unit test org",
      sbi: 999000,
      id: 111
    };
    const organisationPermission = false;

    const mockSetBindings = jest.fn();

    const request = {
      yar: {
        id: 1,
      },
      logger: {
        setBindings: mockSetBindings,
      },
    };

    const result = await checkLoginValid({
      h,
      organisation,
      organisationPermission,
      request,
      cphNumbers,
      personSummary,
    });

    expect(result).toEqual({
      redirectPath: null,
      redirectCallback: mockRedirectCallBackAsString,
    });
    expect(getCustomer).toHaveBeenCalledWith(request, sessionKeys.customer.crn);
    expect(setSignInRedirect).not.toHaveBeenCalled();
    expect(customerHasAtLeastOneValidCph).not.toHaveBeenCalled(); // only gets called if an error hasnt been found yet
    expect(mockSetBindings).toHaveBeenCalledWith({ crn: 124, error: "Person id 12345 does not have the required permissions for organisation id 111" });
    expect(raiseIneligibilityEvent).toHaveBeenCalledWith(
      request.yar.id,
      organisation.sbi,
      124,
      organisation.email,
      "InvalidPermissionsError"
    );
    expect(requestAuthorizationCodeUrl).toHaveBeenCalledWith(request);
  });

  test("it returns a redirect callback if there is no valid CPH", async () => {
    customerHasAtLeastOneValidCph.mockResolvedValue(false);
    const mockRedirectCallBackAsString = "im a redirect callback";
    const h = {
      redirect: jest
        .fn()
        .mockReturnValue({
          takeover: jest.fn().mockReturnValue(mockRedirectCallBackAsString),
        }),
    };
    const organisation = {
      address: "1 Brown Lane,Smithering,West Sussex,England,UK,Thompsons,Sisterdene,1-30,Grey Building,Brown Lane,Grenwald,West Sussex,WS11 2DS,GBR",
      email: "unit@test.email.com.test",
      name: "Unit test org",
      sbi: 999000,
      id: 111
    };
    const organisationPermission = true;

    const mockSetBindings = jest.fn();

    const request = {
      yar: {
        id: 1,
      },
      logger: {
        setBindings: mockSetBindings,
      },
    };

    const result = await checkLoginValid({
      h,
      organisation,
      organisationPermission,
      request,
      cphNumbers,
      personSummary
    });

    expect(result).toEqual({
      redirectPath: null,
      redirectCallback: mockRedirectCallBackAsString,
    });
    expect(getCustomer).toHaveBeenCalledWith(request, sessionKeys.customer.crn);
    expect(setSignInRedirect).not.toHaveBeenCalled();
    expect(customerHasAtLeastOneValidCph).toHaveBeenCalledWith(cphNumbers); // only gets called if an error hasnt been found yet
    expect(mockSetBindings).toHaveBeenCalledWith({ crn: 124, error: "Organisation id 111 has no valid CPH's associated" });
    expect(raiseIneligibilityEvent).toHaveBeenCalledWith(
      request.yar.id,
      organisation.sbi,
      124,
      organisation.email,
      "NoEligibleCphError"
    );
    expect(requestAuthorizationCodeUrl).toHaveBeenCalledWith(request);
  });

  test("it returns a redirect callback if there is no valid CPH", async () => {
    customerHasAtLeastOneValidCph.mockResolvedValue(false);
    const mockRedirectCallBackAsString = "im a redirect callback";
    const h = {
      redirect: jest
        .fn()
        .mockReturnValue({
          takeover: jest.fn().mockReturnValue(mockRedirectCallBackAsString),
        }),
    };
    const organisation = {
      address: "1 Brown Lane,Smithering,West Sussex,England,UK,Thompsons,Sisterdene,1-30,Grey Building,Brown Lane,Grenwald,West Sussex,WS11 2DS,GBR",
      email: "unit@test.email.com.test",
      name: "Unit test org",
      sbi: 999000,
      id: 111
    };
    const organisationPermission = true;

    const mockSetBindings = jest.fn();

    const request = {
      yar: {
        id: 1,
      },
      logger: {
        setBindings: mockSetBindings,
      },
    };

    const result = await checkLoginValid({
      h,
      organisation,
      organisationPermission,
      request,
      cphNumbers,
      personSummary,
    });

    expect(result).toEqual({
      redirectPath: null,
      redirectCallback: mockRedirectCallBackAsString,
    });
    expect(getCustomer).toHaveBeenCalledWith(request, sessionKeys.customer.crn);
    expect(setSignInRedirect).not.toHaveBeenCalled();
    expect(customerHasAtLeastOneValidCph).toHaveBeenCalledWith(cphNumbers); // only gets called if an error hasnt been found yet
    expect(mockSetBindings).toHaveBeenCalledWith({ crn: 124, error: "Organisation id 111 has no valid CPH's associated" });
    expect(raiseIneligibilityEvent).toHaveBeenCalledWith(
      request.yar.id,
      organisation.sbi,
      124,
      organisation.email,
      "NoEligibleCphError"
    );
    expect(requestAuthorizationCodeUrl).toHaveBeenCalledWith(request);
    customerHasAtLeastOneValidCph.mockResolvedValue(true);
  });

  test("it returns a redirect path to apply journey if there are no problems and the user has no applications", async () => {
    getLatestApplicationsBySbi.mockResolvedValue([]);
    const mockRedirectCallBackAsString = "im a redirect callback";
    const h = {
      redirect: jest
        .fn()
        .mockReturnValue({
          takeover: jest.fn().mockReturnValue(mockRedirectCallBackAsString),
        }),
    };
    const organisation = {
      address: "1 Brown Lane,Smithering,West Sussex,England,UK,Thompsons,Sisterdene,1-30,Grey Building,Brown Lane,Grenwald,West Sussex,WS11 2DS,GBR",
      email: "unit@test.email.com.test",
      name: "Unit test org",
      sbi: 999000,
      id: 111
    };
    const organisationPermission = true;

    const mockSetBindings = jest.fn();

    const request = {
      yar: {
        id: 1,
      },
      logger: {
        setBindings: mockSetBindings,
      },
    };

    const result = await checkLoginValid({
      h,
      organisation,
      organisationPermission,
      request,
      cphNumbers,
      personSummary,
    });

    expect(result.redirectPath).toEqual("/check-details");
    expect(result.redirectCallback).toBeNull();
    expect(getCustomer).toHaveBeenCalledWith(request, sessionKeys.customer.crn);
    expect(setSignInRedirect).toHaveBeenCalledWith(request, sessionKeys.signInRedirect, true);
    expect(customerHasAtLeastOneValidCph).toHaveBeenCalledWith(cphNumbers);
    expect(mockSetBindings).not.toHaveBeenCalled();
    expect(raiseIneligibilityEvent).not.toHaveBeenCalled();
    expect(requestAuthorizationCodeUrl).not.toHaveBeenCalled();
  });

  test("it returns a redirect path to dashboard entry if there are no problems and the user an agreed new world application", async () => {
    getLatestApplicationsBySbi.mockResolvedValue([
      {
        type: "EE",
        statusId: 1,
        createdAt: new Date(),
      },
    ]);
    const mockRedirectCallBackAsString = "im a redirect callback";
    const h = {
      redirect: jest
        .fn()
        .mockReturnValue({
          takeover: jest.fn().mockReturnValue(mockRedirectCallBackAsString),
        }),
    };
    const organisation = {
      address: "1 Brown Lane,Smithering,West Sussex,England,UK,Thompsons,Sisterdene,1-30,Grey Building,Brown Lane,Grenwald,West Sussex,WS11 2DS,GBR",
      email: "unit@test.email.com.test",
      name: "Unit test org",
      sbi: 999000,
      id: 111
    };
    const organisationPermission = true;

    const mockSetBindings = jest.fn();

    const request = {
      yar: {
        id: 1,
      },
      logger: {
        setBindings: mockSetBindings,
      },
    };

    const result = await checkLoginValid({
      h,
      organisation,
      organisationPermission,
      request,
      cphNumbers,
      personSummary,
    });

    expect(result.redirectPath).toEqual("/check-details");
    expect(result.redirectCallback).toBeNull();
    expect(getCustomer).toHaveBeenCalledWith(request, sessionKeys.customer.crn);
    expect(setSignInRedirect).not.toHaveBeenCalled();
    expect(customerHasAtLeastOneValidCph).toHaveBeenCalledWith(cphNumbers);
    expect(mockSetBindings).not.toHaveBeenCalled();
    expect(raiseIneligibilityEvent).not.toHaveBeenCalled();
    expect(requestAuthorizationCodeUrl).not.toHaveBeenCalled();
  });

  test("it returns a redirect path to apply journey if there are no problems and the user an non-agreed new world application", async () => {
    getLatestApplicationsBySbi.mockResolvedValue([
      {
        type: "EE",
        statusId: 4,
        createdAt: new Date(),
      },
    ]);
    const mockRedirectCallBackAsString = "im a redirect callback";
    const h = {
      redirect: jest
        .fn()
        .mockReturnValue({
          takeover: jest.fn().mockReturnValue(mockRedirectCallBackAsString),
        }),
    };
    const organisation = {
      address: "1 Brown Lane,Smithering,West Sussex,England,UK,Thompsons,Sisterdene,1-30,Grey Building,Brown Lane,Grenwald,West Sussex,WS11 2DS,GBR",
      email: "unit@test.email.com.test",
      name: "Unit test org",
      sbi: 999000,
      id: 111
    };
    const organisationPermission = true;

    const mockSetBindings = jest.fn();

    const request = {
      yar: {
        id: 1,
      },
      logger: {
        setBindings: mockSetBindings,
      },
    };

    const result = await checkLoginValid({
      h,
      organisation,
      organisationPermission,
      request,
      cphNumbers,
      personSummary,
    });

    expect(result.redirectPath).toEqual("/check-details");
    expect(result.redirectCallback).toBeNull();
    expect(getCustomer).toHaveBeenCalledWith(request, sessionKeys.customer.crn);
    expect(setSignInRedirect).toHaveBeenCalledWith(request, sessionKeys.signInRedirect, true);
    expect(customerHasAtLeastOneValidCph).toHaveBeenCalledWith(cphNumbers);
    expect(mockSetBindings).not.toHaveBeenCalled();
    expect(raiseIneligibilityEvent).not.toHaveBeenCalled();
    expect(requestAuthorizationCodeUrl).not.toHaveBeenCalled();
  });

  test("it returns a redirect path to apply journey if there are no problems and the user a closed status old world application", async () => {
    getLatestApplicationsBySbi.mockResolvedValue([
      {
        type: "VV",
        statusId: 2,
        createdAt: new Date(),
      },
    ]);
    const mockRedirectCallBackAsString = "im a redirect callback";
    const h = {
      redirect: jest
        .fn()
        .mockReturnValue({
          takeover: jest.fn().mockReturnValue(mockRedirectCallBackAsString),
        }),
    };
    const organisation = {
      address: "1 Brown Lane,Smithering,West Sussex,England,UK,Thompsons,Sisterdene,1-30,Grey Building,Brown Lane,Grenwald,West Sussex,WS11 2DS,GBR",
      email: "unit@test.email.com.test",
      name: "Unit test org",
      sbi: 999000,
      id: 111
    };
    const organisationPermission = true;

    const mockSetBindings = jest.fn();

    const request = {
      yar: {
        id: 1,
      },
      logger: {
        setBindings: mockSetBindings,
      },
    };

    const result = await checkLoginValid({
      h,
      organisation,
      organisationPermission,
      request,
      cphNumbers,
      personSummary,
    });

    expect(result.redirectPath).toEqual("/check-details");
    expect(result.redirectCallback).toBeNull();
    expect(getCustomer).toHaveBeenCalledWith(request, sessionKeys.customer.crn);
    expect(setSignInRedirect).toHaveBeenCalledWith(request, sessionKeys.signInRedirect, true);
    expect(customerHasAtLeastOneValidCph).toHaveBeenCalledWith(cphNumbers);
    expect(mockSetBindings).not.toHaveBeenCalled();
    expect(raiseIneligibilityEvent).not.toHaveBeenCalled();
    expect(requestAuthorizationCodeUrl).not.toHaveBeenCalled();
  });

  test("it returns a redirect callback if there are no problems but the user has a non-closed status old world application", async () => {
    getLatestApplicationsBySbi.mockResolvedValue([
      {
        type: "VV",
        statusId: 1,
        createdAt: new Date(),
      },
    ]);
    const mockRedirectCallBackAsString = "im a redirect callback";
    const h = {
      redirect: jest
        .fn()
        .mockReturnValue({
          takeover: jest.fn().mockReturnValue(mockRedirectCallBackAsString),
        }),
    };
    const organisation = {
      address: "1 Brown Lane,Smithering,West Sussex,England,UK,Thompsons,Sisterdene,1-30,Grey Building,Brown Lane,Grenwald,West Sussex,WS11 2DS,GBR",
      email: "unit@test.email.com.test",
      name: "Unit test org",
      sbi: 999000,
      id: 111
    };
    const organisationPermission = true;

    const mockSetBindings = jest.fn();

    const request = {
      yar: {
        id: 1,
      },
      logger: {
        setBindings: mockSetBindings,
      },
    };
    const result = await checkLoginValid({
      h,
      organisation,
      organisationPermission,
      request,
      cphNumbers,
      personSummary,
    });

    expect(result.redirectPath).toBeNull();
    expect(result.redirectCallback).toBe(mockRedirectCallBackAsString);
    expect(getCustomer).toHaveBeenCalledWith(request, sessionKeys.customer.crn);
    expect(setSignInRedirect).not.toHaveBeenCalled();
    expect(customerHasAtLeastOneValidCph).toHaveBeenCalledWith(cphNumbers);
    expect(mockSetBindings).not.toHaveBeenCalled();
    expect(raiseIneligibilityEvent).toHaveBeenCalled();
    expect(requestAuthorizationCodeUrl).toHaveBeenCalled();
  });

  test("it returns a redirect callback when the agreement is redacted", async () => {
    getLatestApplicationsBySbi.mockResolvedValue([
      {
        type: "EE",
        statusId: 1,
        createdAt: new Date(),
        reference: 'IAHW-12345',
        applicationRedacts: [
          {
            success: 'Y'
          }
        ]
      },
    ]);
    const mockRedirectCallBackAsString = "im a redirect callback";
    const h = {
      redirect: jest
        .fn()
        .mockReturnValue({
          takeover: jest.fn().mockReturnValue(mockRedirectCallBackAsString),
        }),
    };
    const organisation = {
      address: "1 Brown Lane,Smithering,West Sussex,England,UK,Thompsons,Sisterdene,1-30,Grey Building,Brown Lane,Grenwald,West Sussex,WS11 2DS,GBR",
      email: "unit@test.email.com.test",
      name: "Unit test org",
      sbi: 999000,
      locked: false,
      id: 111
    };
    const organisationPermission = true;

    const mockSetBindings = jest.fn();

    const request = {
      yar: {
        id: 1,
      },
      logger: {
        setBindings: mockSetBindings,
      },
    };

    const result = await checkLoginValid({
      h,
      organisation,
      organisationPermission,
      request,
      apimAccessToken,
      personSummary,
    });

    expect(result).toEqual({
      redirectPath: null,
      redirectCallback: mockRedirectCallBackAsString,
    });
    expect(getCustomer).toHaveBeenCalledWith(request, sessionKeys.customer.crn);
    expect(setSignInRedirect).not.toHaveBeenCalled();
    expect(customerHasAtLeastOneValidCph).toHaveBeenCalled();
    expect(mockSetBindings).toHaveBeenCalledWith({ crn: 124, error: "Agreement IAHW-12345 has been redacted" });
    expect(raiseIneligibilityEvent).toHaveBeenCalledWith(
      request.yar.id,
      organisation.sbi,
      124,
      organisation.email,
      "AgreementRedactedError"
    );
    expect(requestAuthorizationCodeUrl).toHaveBeenCalledWith(request);
  });
});
