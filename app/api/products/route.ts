// app/api/products/route.ts
import { NextResponse, NextRequest } from 'next/server';
import db from '@/utils/db';
import { auth } from '@clerk/nextjs/server';
import { Prisma, Product } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '12');
  const search = searchParams.get('search') ?? '';

  const { userId } = await auth();
  const clerkId = userId ?? null;

  const where: Prisma.ProductWhereInput | undefined = search
    ? {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            material: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }
    : undefined;

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

  // ✅ 定義清楚「有 favorites 的型別」
  type ProductWithFavorites = Prisma.ProductGetPayload<{
    include: {
      favorites: {
        select: { id: true };
      };
    };
  }>;

  // ✅ 統一 output 型別：每筆 product 多一個 favoriteId
  let productsWithFavoriteId: Array<Product & { favoriteId: string | null }>;

  if (clerkId) {
    // 已登入：products 實際上是 ProductWithFavorites[]
    const typed = products as ProductWithFavorites[];

    productsWithFavoriteId = typed.map((p) => ({
      ...p,
      favoriteId: p.favorites[0]?.id ?? null,
    }));
  } else {
    // 未登入：products 就是 Product[]
    const typed = products as Product[];

    productsWithFavoriteId = typed.map((p) => ({
      ...p,
      favoriteId: null,
    }));
  }

  return NextResponse.json({
    products: productsWithFavoriteId,
    totalProducts,
    pageSize,
  });
}
