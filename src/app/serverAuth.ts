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

/**
 * True when the browser reached the instance over HTTPS, directly or through
 * a TLS-terminating proxy. Plain-HTTP self-hosting (localhost, LAN) keeps
 * working: the cookie is only marked Secure when it can actually be sent.
 */
export function isSecureRequest(request: Request): boolean {
  const forwarded = request.headers.get('x-forwarded-proto')?.split(',')[0].trim().toLowerCase();
  if (forwarded) return forwarded === 'https';
  try {
    return new URL(request.url).protocol === 'https:';
  } catch {
    return false;
  }
}

export function buildSessionCookie(token: string, maxAgeSeconds: number, secure = false): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${
    secure ? '; Secure' : ''
  }`;
}

export function buildSessionClearCookie(secure = false): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
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
