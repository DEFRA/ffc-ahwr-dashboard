import { raiseEvent } from "../../../../app/event/raise-event.js";
import { PublishEvent } from "ffc-ahwr-event-publisher";

jest.mock("ffc-ahwr-event-publisher", () => ({
  PublishEvent: jest.fn().mockImplementation(() => ({
    sendEvent: jest.fn(),
  })),
}));

jest.mock("../../../../app/config/messaging", () => ({
  ...jest.requireActual("../../../../app/config/messaging"),
  eventQueue: {
    address: "test-queue",
    type: "queue",
  },
}));

// Mock `PublishEvent` with a constructor that returns an object containing a mock `sendEvent` method
jest.mock("ffc-ahwr-event-publisher", () => ({
  PublishEvent: jest.fn().mockImplementation(() => ({
    sendEvent: jest.fn().mockResolvedValue(undefined), // Ensure sendEvent is a mock function
  })),
}));

describe("raiseEvent function", () => {
  const testEvent = {
    name: "Test Event",
    id: "12345",
    sbi: "123456789",
    cph: "12/345/6789",
    type: "testType",
    message: "Test message",
    data: { test: "data" },
    email: "test@example.com",
  };

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    PublishEvent.mockClear();
  });

  test("should instantiate PublishEvent with the correct queue", async () => {
    await raiseEvent(testEvent);

    expect(PublishEvent).toHaveBeenCalledWith({
      address: "test-queue",
      type: "queue",
    });
  });

  test("should call sendEvent with the correct event message structure", async () => {
    await raiseEvent(testEvent);
    const mockSendEvent = PublishEvent.mock.results[0].value.sendEvent;

    const expectedMessage = {
      name: testEvent.name,
      properties: {
        id: testEvent.id,
        sbi: testEvent.sbi,
        cph: testEvent.cph,
        checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
        status: "success",
        action: {
          type: testEvent.type,
          message: testEvent.message,
          data: testEvent.data,
          raisedBy: testEvent.email,
        },
      },
    };

    expect(mockSendEvent).toHaveBeenCalledWith(expectedMessage);
  });

  test("should allow status override", async () => {
    const customStatus = "failed";
    await raiseEvent(testEvent, customStatus);
    const mockSendEvent = PublishEvent.mock.results[0].value.sendEvent;

    expect(mockSendEvent.mock.calls[0][0].properties.status).toBe(customStatus);
  });
  beforeEach(() => {
    // Clear mocks before each test
    PublishEvent.mockClear();
  });
});
