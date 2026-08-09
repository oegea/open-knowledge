import { cookies } from 'next/headers';
import identityFactory from '@/modules/identity/application/factory';
import { User } from '@/modules/identity/domain/User';
import { isStaticMode } from '@/modules/shared/infrastructure/StaticContentClient';

export const SESSION_COOKIE = 'ok_session';

/** Resolves the authenticated user from the session cookie, or null. */
export async function getCurrentUser(): Promise<User | null> {
  // Static content mode has no identity at all (ADR 0013).
  if (isStaticMode()) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return await identityFactory.getSessionUser(token);
}

export function buildSessionCookie(token: string, maxAgeSeconds: number): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function buildSessionClearCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/** Guard for admin-only API routes. Returns an error Response or null. */
export async function requireAdmin(): Promise<Response | null> {
  const user = await getCurrentUser();
  if (user === null) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (!user.isAdmin()) {
    return Response.json({ error: 'Administrator access required' }, { status: 403 });
  }
  return null;
}
