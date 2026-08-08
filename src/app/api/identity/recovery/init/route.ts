import type { NextRequest } from 'next/server';
import QRCode from 'qrcode';
import identityFactory from '@/modules/identity/application/factory';
import { allowRequest, clientIp } from '../../rateLimit';

export async function POST(request: NextRequest) {
  if (!allowRequest(`recovery:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
    return Response.json({ error: 'Too many recovery attempts' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const challenge = await identityFactory.initAccountRecovery(
      body.identifier,
      body.recoveryCode
    );
    const qrDataUrl = await QRCode.toDataURL(challenge.otpauthUri, { margin: 1, width: 320 });
    return Response.json({ ...challenge, qrDataUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Recovery failed';
    return Response.json({ error: message }, { status: 401 });
  }
}
