// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchProductsPage } from '@/utils/actions';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const page = Number(searchParams.get('page') ?? '1');
  const pageSizeParam = Number(searchParams.get('pageSize') ?? '0');

  const { products, totalProducts, pageSize } = await fetchProductsPage({
    search,
    page,
  });

  // 讓前端可以改 pageSize 但不一定要一樣，先以後端為主
  return NextResponse.json({
    products,
    totalProducts,
    pageSize: pageSizeParam || pageSize,
  });
}
