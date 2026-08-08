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
    if (body.isAdmin !== true) {
      return Response.json({ error: 'Only promoting to admin is supported' }, { status: 400 });
    }
    const user = await identityFactory.promoteUserToAdmin(id);
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
