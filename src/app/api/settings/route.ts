import type { NextRequest } from 'next/server';
import settingsFactory from '@/modules/settings/application/factory';
import identityFactory from '@/modules/identity/application/factory';
import { requireAdmin } from '@/app/serverAuth';
import { apiError } from '../apiError';

export async function GET() {
  const settings = await settingsFactory.getInstanceSettings();
  const hasUsers = await identityFactory.hasUsers();
  return Response.json({ settings: settings.toPrimitive(), hasUsers });
}

export async function PUT(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const settings = await settingsFactory.updateInstanceSettings(body);
    return Response.json({ settings: settings.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}
