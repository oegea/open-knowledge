import type { NextRequest } from 'next/server';
import identityFactory from '@/modules/identity/application/factory';
import { SESSION_COOKIE, buildSessionClearCookie } from '@/app/serverAuth';

export async function POST(request: NextRequest) {
  await identityFactory.deleteSession(request.cookies.get(SESSION_COOKIE)?.value);
  return Response.json(
    { loggedOut: true },
    { headers: { 'Set-Cookie': buildSessionClearCookie() } }
  );
}
