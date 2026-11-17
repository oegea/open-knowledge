import type { NextRequest } from 'next/server';
import identityFactory from '@/modules/identity/application/factory';
import { SESSION_DURATION_MS } from '@/modules/identity/application/createSession';
import { buildSessionCookie, isSecureRequest } from '@/app/serverAuth';
import { allowRequest, clientIp } from '../rateLimit';

export async function POST(request: NextRequest) {
  if (!allowRequest(`login:${clientIp(request)}`, 10, 15 * 60 * 1000)) {
    return Response.json({ error: 'Too many login attempts' }, { status: 429 });
  }

  try {
    const body = await request.json();
    // Second bucket keyed by the account: X-Forwarded-For is client-controlled
    // on instances without a proxy, so the per-IP limit alone would let the
    // 6-digit code be brute-forced by rotating that header.
    const identifierKey = String(body?.identifier ?? '').trim().toLowerCase().slice(0, 64);
    if (identifierKey && !allowRequest(`login-id:${identifierKey}`, 10, 15 * 60 * 1000)) {
      return Response.json({ error: 'Too many login attempts' }, { status: 429 });
    }
    const user = await identityFactory.loginUser(body.identifier, body.code);
    const { token } = await identityFactory.createSession(user.getId()!);

    return Response.json(
      { user: { identifier: user.getIdentifier(), isAdmin: user.isAdmin() } },
      { headers: { 'Set-Cookie': buildSessionCookie(token, SESSION_DURATION_MS / 1000, isSecureRequest(request)) } }
    );
  } catch (error) {
    // Uniform 401 for credential failures: no account enumeration.
    const message = error instanceof Error ? error.message : 'Login failed';
    return Response.json({ error: message }, { status: 401 });
  }
}
