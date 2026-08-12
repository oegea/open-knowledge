import type { NextRequest } from 'next/server';
import categoryFactory from '@/modules/category/application/factory';
import { requireAdmin } from '@/app/serverAuth';
import { apiError } from '../apiError';

export async function GET() {
  const categories = await categoryFactory.listCategories();
  return Response.json({ categories: categories.map((category) => category.toPrimitive()) });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const category = await categoryFactory.createCategory(body.name, body.imagePath);
    return Response.json({ category: category.toPrimitive() }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
