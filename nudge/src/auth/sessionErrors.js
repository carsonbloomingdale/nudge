/** Thrown when login/register succeeded but the session could not be verified (e.g. cookies blocked). */
export class SessionVerificationError extends Error {
  constructor(message) {
    super(message);
    this.name = "SessionVerificationError";
  }
}
