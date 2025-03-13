import { raiseEvent } from "./raise-event.js";

const renameClaimEntryKeyForEventReporting = (entryKey) =>
  entryKey === "endemicsClaim" ? "claim" : entryKey;

export const sendSessionEvent = (
  organisation,
  sessionId,
  entryKey,
  key,
  value,
  ip,
) => {
  entryKey = renameClaimEntryKeyForEventReporting(entryKey);

  if (sessionId && organisation) {
    const event = {
      id: sessionId,
      sbi: organisation.sbi,
      cph: "n/a",
      email: organisation.email,
      name: "send-session-event",
      type: `${entryKey}-${key}`,
      message: `Session set for ${entryKey} and ${key}.`,
      data: { [key]: value },
      ip,
    };
    raiseEvent(event);
  }
};
