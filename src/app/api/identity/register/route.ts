import type { NextRequest } from 'next/server';
import identityFactory from '@/modules/identity/application/factory';
import { SESSION_DURATION_MS } from '@/modules/identity/application/createSession';
import { buildSessionCookie } from '@/app/serverAuth';
import { apiError } from '../../apiError';
import { allowRequest, clientIp } from '../rateLimit';

export async function POST(request: NextRequest) {
  if (!allowRequest(`register:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
    return Response.json({ error: 'Too many registration attempts' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { user, recoveryCode } = await identityFactory.registerUser(
      body.identifier,
      body.secret,
      body.code
    );
    const { token } = await identityFactory.createSession(user.getId()!);

    return Response.json(
      {
        user: { identifier: user.getIdentifier(), isAdmin: user.isAdmin() },
        recoveryCode,
      },
      {
        status: 201,
        headers: { 'Set-Cookie': buildSessionCookie(token, SESSION_DURATION_MS / 1000) },
      }
    );
  } catch (error) {
    return apiError(error);
  }
}
