export class ClaimHasExpiredError extends Error {
  constructor(message, latestApplicationDate, claimExpiredDate) {
    super(message);
    this.name = "ClaimHasExpired";
    this.latestApplicationDate = latestApplicationDate;
    this.claimExpiredDate = claimExpiredDate;
  }
}
