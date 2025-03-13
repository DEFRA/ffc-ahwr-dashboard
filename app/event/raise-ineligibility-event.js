import { raiseEvent } from "./raise-event.js";

export const raiseIneligibilityEvent = async (
  sessionId,
  sbi,
  crn,
  email,
  exception,
  status = "alert",
) => {
  if (sessionId && exception) {
    const event = {
      id: sessionId,
      sbi: `${sbi}`,
      cph: "n/a",
      email,
      name: "send-ineligibility-event",
      type: "ineligibility-event",
      message: `Apply: ${exception}`,
      data: {
        sbi,
        crn,
        exception,
        raisedAt: new Date(),
        journey: "apply",
      },
      status,
    };
    await raiseEvent(event, status);
  }
};
