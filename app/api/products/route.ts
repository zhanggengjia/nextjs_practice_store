// app/api/products/route.ts
import { NextResponse, NextRequest } from 'next/server';
import db from '@/utils/db';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '12');
  const search = searchParams.get('search') ?? '';

  // ✔ 不用 getAuthUser()，因為那會在未登入時丟錯
  const { userId } = await auth();
  const clerkId = userId ?? null;

  // ✔ where 條件
  const where: Prisma.ProductWhereInput | undefined = search
    ? {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
          {
            material: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }
    : {};

  // ✔ 有登入才 include favorites
  const [products, totalProducts] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: clerkId
        ? {
            favorites: {
              where: { clerkId },
              select: { id: true },
            },
          }
        : undefined,
    }),
    db.product.count({ where }),
  ]);

  // ✔ 統一 favoriteId 格式
  const productsWithFavoriteId = products.map((p: any) => ({
    ...p,
    favoriteId: clerkId ? p.favorites?.[0]?.id ?? null : null,
  }));

  return NextResponse.json({
    products: productsWithFavoriteId,
    totalProducts,
    pageSize,
  });
}
