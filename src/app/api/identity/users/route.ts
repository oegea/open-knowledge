import identityFactory from '@/modules/identity/application/factory';
import { requireAdmin } from '@/app/serverAuth';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const users = await identityFactory.listUsers();
  // Secrets never leave the module: expose only what the panel shows.
  return Response.json({
    users: users.map((user) => ({
      id: user.getId(),
      identifier: user.getIdentifier(),
      displayName: user.getDisplayName(),
      isAdmin: user.isAdmin(),
      createdAt: user.getCreatedAt().toISOString(),
    })),
  });
}
