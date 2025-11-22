// app/api/products/route.ts
import { NextResponse, NextRequest } from 'next/server';
import db from '@/utils/db';
import { auth, currentUser } from '@clerk/nextjs/server';
import type { Prisma, Product } from '@prisma/client';

type ProductWithFavoriteId = Product & {
  favoriteId: string | null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '12');
  const search = searchParams.get('search') ?? '';

  // 🔹 Clerk 的 auth 在 App Router 是「同步」的，不要寫 await auth()
  const user = await currentUser();
  const userId = user?.id;
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

  // 🔹 明確型別：products 可能帶 favorites，也可能沒有
  type ProductWithMaybeFavorites = Product & {
    favorites?: { id: string }[];
  };

  const productsWithFavoriteId: ProductWithFavoriteId[] = (
    products as ProductWithMaybeFavorites[]
  ).map((p) => ({
    ...p,
    favoriteId: clerkId ? p.favorites?.[0]?.id ?? null : null,
  }));

  return NextResponse.json({
    products: productsWithFavoriteId,
    totalProducts,
    pageSize,
  });
}
