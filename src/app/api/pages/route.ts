import type { NextRequest } from 'next/server';
import pagesFactory from '@/modules/pages/application/factory';
import { getCurrentUser, requireAdmin } from '@/app/serverAuth';
import { apiError } from '../apiError';

export async function GET() {
  const user = await getCurrentUser();
  const pages = await pagesFactory.listPages();
  const visible = user?.isAdmin()
    ? pages
    : pages.filter((page) => page.getPlacement() !== 'hidden');
  return Response.json({ pages: visible.map((page) => page.toPrimitive()) });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const page = await pagesFactory.createPage(body.title, body.markdown, body.placement);
    return Response.json({ page: page.toPrimitive() }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
