import type { NextRequest } from 'next/server';
import newsFactory from '@/modules/news/application/factory';
import settingsFactory from '@/modules/settings/application/factory';
import { getCurrentUser, requireAdmin } from '@/app/serverAuth';
import { apiError } from '../apiError';

export async function GET() {
  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin() ?? false;

  if (!isAdmin) {
    const settings = await settingsFactory.getInstanceSettings();
    if (!settings.isNewsEnabled()) {
      return Response.json({ posts: [] });
    }
  }

  const posts = await newsFactory.listNewsPosts(!isAdmin);
  return Response.json({ posts: posts.map((post) => post.toPrimitive()) });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const post = await newsFactory.createNewsPost(body.title, body.markdown, body.published);
    return Response.json({ post: post.toPrimitive() }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
