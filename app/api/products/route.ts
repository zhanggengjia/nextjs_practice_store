// app/api/products/route.ts
import { NextResponse } from 'next/server';
import db from '@/utils/db';
import { getAuthUser } from '@/utils/actions';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '12');
  const search = searchParams.get('search') ?? '';

  const user = await getAuthUser(); // 這裡拿到目前登入的使用者

  const where: Prisma.ProductWhereInput | undefined = search
    ? {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive' as const, // 關鍵：保持 literal type
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

  const [products, totalProducts] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        favorites: {
          where: {
            clerkId: user.id,
          },
          select: {
            id: true,
          },
        },
      },
    }),
    db.product.count({ where }),
  ]);

  // 統一變成 ProductWithFavoriteId 結構
  const productsWithFavoriteId = products.map((p) => ({
    ...p,
    favoriteId: p.favorites[0]?.id ?? null,
  }));

  return NextResponse.json({
    products: productsWithFavoriteId,
    totalProducts,
  });
}
