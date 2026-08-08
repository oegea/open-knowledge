import type { NextRequest } from 'next/server';
import certificateFactory from '@/modules/certificate/application/factory';
import { requireAdmin } from '@/app/serverAuth';
import { apiError } from '../../apiError';

/** Admin-only: revoking a certificate deletes it for good. */
export async function DELETE(_request: NextRequest, ctx: RouteContext<'/api/certificates/[id]'>) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    await certificateFactory.revokeCertificate(id);
    return Response.json({ revoked: true });
  } catch (error) {
    return apiError(error);
  }
}
