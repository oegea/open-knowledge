import type { NextRequest } from 'next/server';
import identityFactory from '@/modules/identity/application/factory';
import { SESSION_DURATION_MS } from '@/modules/identity/application/createSession';
import { buildSessionCookie } from '@/app/serverAuth';
import { allowRequest, clientIp } from '../../rateLimit';

export async function POST(request: NextRequest) {
  if (!allowRequest(`recovery:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
    return Response.json({ error: 'Too many recovery attempts' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { user, recoveryCode } = await identityFactory.confirmAccountRecovery(
      body.identifier,
      body.recoveryCode,
      body.secret,
      body.code
    );
    const { token } = await identityFactory.createSession(user.getId()!);

    return Response.json(
      {
        user: { identifier: user.getIdentifier(), isAdmin: user.isAdmin() },
        recoveryCode,
      },
      { headers: { 'Set-Cookie': buildSessionCookie(token, SESSION_DURATION_MS / 1000) } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Recovery failed';
    return Response.json({ error: message }, { status: 401 });
  }
}
