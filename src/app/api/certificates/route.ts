import type { NextRequest } from 'next/server';
import certificateFactory from '@/modules/certificate/application/factory';
import { getCurrentUser } from '@/app/serverAuth';
import { apiError } from '../apiError';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (user === null) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const certificate = await certificateFactory.issueCertificate(
      user.getId()!,
      user.getIdentifier(),
      body.courseId
    );
    return Response.json({ certificate: certificate.toPrimitive() }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (user === null) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  const certificates = await certificateFactory.listCertificates(user.getId()!);
  return Response.json({
    certificates: certificates.map((certificate) => certificate.toPrimitive()),
  });
}
