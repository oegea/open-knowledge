import type { NextRequest } from 'next/server';
import mediaFactory from '@/modules/media/application/factory';
import { apiError } from '../apiError';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const kind = String(formData.get('kind') ?? '');

    if (!(file instanceof File)) {
      return Response.json({ error: '[media] file field is required' }, { status: 400 });
    }

    const data = Buffer.from(await file.arrayBuffer());
    const relativePath = await mediaFactory.storeMediaFile(kind, file.name, file.type, data);

    return Response.json({ path: `/api/media/${relativePath}` }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
