import type { NextRequest } from 'next/server';
import backupFactory from '@/modules/backup/application/factory';
import { requireAdmin } from '@/app/serverAuth';
import { apiError } from '../apiError';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const archive = await backupFactory.createBackup();
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(new Uint8Array(archive), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="openknowledge-backup-${stamp}.zip"`,
        'Content-Length': String(archive.byteLength),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return Response.json({ error: '[restoreBackup] file field is required' }, { status: 400 });
    }

    await backupFactory.restoreBackup(Buffer.from(await file.arrayBuffer()));
    // Sessions were replaced along with everything else: clients must sign in again.
    return Response.json({ restored: true });
  } catch (error) {
    return apiError(error);
  }
}
