export class AgreementRedactedError extends Error {
  constructor(message) {
    super(message);
    this.name = "AgreementRedactedError";
  }
}
