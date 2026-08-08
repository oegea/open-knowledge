import { generateSecret, generateURI, verify } from 'otplib';
import { TotpRepository } from '../domain/TotpRepository';

export class OtplibTotpRepository implements TotpRepository {
  constructor(private readonly issuer: string = 'Open Knowledge') {}

  generateSecret(): string {
    return generateSecret();
  }

  buildOtpauthUri(identifier: string, secret: string): string {
    return generateURI({ issuer: this.issuer, label: identifier, secret });
  }

  async verify(code: string, secret: string): Promise<boolean> {
    if (!code || typeof code !== 'string') return false;
    try {
      const result = await verify({ secret, token: code.replace(/\s/g, '') });
      return result.valid;
    } catch {
      return false;
    }
  }
}
