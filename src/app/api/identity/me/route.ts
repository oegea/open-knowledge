import type { NextRequest } from 'next/server';
import identityFactory from '@/modules/identity/application/factory';
import { getCurrentUser } from '@/app/serverAuth';
import { apiError } from '../../apiError';

export async function GET() {
  const user = await getCurrentUser();
  if (user === null) {
    return Response.json({ user: null });
  }
  return Response.json({
    user: {
      identifier: user.getIdentifier(),
      isAdmin: user.isAdmin(),
      displayName: user.getDisplayName(),
    },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (user === null) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = await identityFactory.updateDisplayName(
      user.getId()!,
      String(body.displayName ?? '')
    );
    return Response.json({
      user: {
        identifier: updated.getIdentifier(),
        isAdmin: updated.isAdmin(),
        displayName: updated.getDisplayName(),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
