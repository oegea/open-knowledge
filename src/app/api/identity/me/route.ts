import { getCurrentUser } from '@/app/serverAuth';

export async function GET() {
  const user = await getCurrentUser();
  if (user === null) {
    return Response.json({ user: null });
  }
  return Response.json({
    user: { identifier: user.getIdentifier(), isAdmin: user.isAdmin() },
  });
}
