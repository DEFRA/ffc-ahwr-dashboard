export class OutstandingAgreementError extends Error {
  constructor(message) {
    super(message);
    this.name = "OutstandingAgreementError";
  }
}
