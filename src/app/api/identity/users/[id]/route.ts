import type { NextRequest } from 'next/server';
import identityFactory from '@/modules/identity/application/factory';
import { getCurrentUser, requireAdmin } from '@/app/serverAuth';
import { apiError } from '../../../apiError';

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/identity/users/[id]'>) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const body = await request.json();
    let user;
    if (typeof body.displayName === 'string') {
      // Same use case the learner uses on their own account, so issued
      // certificates stay in sync through the onDisplayNameChanged port.
      user = await identityFactory.updateDisplayName(id, body.displayName);
    } else if (body.isAdmin === true) {
      user = await identityFactory.promoteUserToAdmin(id);
    } else {
      return Response.json(
        { error: 'Provide displayName or isAdmin: true' },
        { status: 400 }
      );
    }
    return Response.json({
      user: {
        id: user.getId(),
        identifier: user.getIdentifier(),
        displayName: user.getDisplayName(),
        isAdmin: user.isAdmin(),
        createdAt: user.getCreatedAt().toISOString(),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<'/api/identity/users/[id]'>) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const actingUser = await getCurrentUser();
    await identityFactory.deleteUser(id, actingUser!.getId()!);
    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
