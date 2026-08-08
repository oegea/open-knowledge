/**
 * Time-based one-time password operations (RFC 6238), abstracted so use
 * cases stay pure and testable.
 */
export interface TotpRepository {
  generateSecret(): string;
  /** Builds the otpauth:// URI encoded into the authenticator QR code. */
  buildOtpauthUri(identifier: string, secret: string): string;
  verify(code: string, secret: string): Promise<boolean>;
}
