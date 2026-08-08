import type { NextRequest } from 'next/server';
import certificateFactory from '@/modules/certificate/application/factory';
import { getLocale } from '@/i18n/getLocale';
import { apiError } from '../../../apiError';

export async function GET(request: NextRequest, ctx: RouteContext<'/api/certificates/[id]/pdf'>) {
  try {
    const { id } = await ctx.params;
    const host = request.headers.get('host') ?? 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') ?? 'http';
    const result = await certificateFactory.exportCertificatePdf(
      id,
      `${proto}://${host}`,
      await getLocale()
    );

    return new Response(new Uint8Array(result.data), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length': String(result.data.byteLength),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
