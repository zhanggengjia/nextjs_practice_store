'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Product } from '@prisma/client';
import { formatCurrency } from '@/utils/format';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import FavoriteToggleButton from './FavoriteToggleButton';
import { toImageSrc } from '@/lib/image-url';

type ProductWithFavoriteId = Product & {
  favoriteId: string | null;
};

type ProductsGridTestProps = {
  initialProducts?: ProductWithFavoriteId[];
  search?: string;
  totalProducts?: number;
  pageSize?: number;
};

function ProductsGridTest({
  initialProducts = [],
  search = '',
  totalProducts = 0,
  pageSize = 12,
}: ProductsGridTestProps) {
  const [products, setProducts] =
    useState<ProductWithFavoriteId[]>(initialProducts);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialProducts.length < totalProducts
  );

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    const nextPage = page + 1;

    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(pageSize),
        search,
      });

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) {
        // 這裡可以加 toast 或 log
        return;
      }

      const data: {
        products: ProductWithFavoriteId[];
        totalProducts: number;
      } = await res.json();

      setProducts((prev) => [...prev, ...data.products]);
      setPage(nextPage);

      const loadedCount = nextPage * pageSize;
      setHasMore(loadedCount < data.totalProducts);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, page, pageSize, search]);

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          void loadMore();
        }
      },
      {
        rootMargin: '200px', // 還沒碰到最底下就先預載
      }
    );

    const node = loaderRef.current;
    if (node) observer.observe(node);

    return () => {
      if (node) observer.unobserve(node);
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  return (
    <>
      <div className="pt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3 ">
        {products.map((product) => {
          const { name, price, image, favoriteId } = product;
          const productId = product.id;
          const dollarsAmount = formatCurrency(price);
          const src = toImageSrc(image);

          return (
            <article key={productId} className="group relative">
              <Link href={`/products/${productId}`}>
                <Card className="transform group-hover:shadow-xl transition-shadow duration-500 !py-0">
                  <CardContent className="p-4">
                    <div className="relative h-64 md:h-48 rounded overflow-hidden">
                      <Image
                        src={src}
                        alt={name}
                        fill
                        sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                        priority={false}
                        className="rounded w-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="mt-4 text-center">
                      <h2 className="text-lg capitalize">{name}</h2>
                      <p className="text-muted-foreground mt-2">
                        {dollarsAmount}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* favorite 按鈕 */}
              <div className="absolute top-7 right-7 z-5">
                <FavoriteToggleButton
                  productId={productId}
                  initialFavoriteId={favoriteId}
                />
              </div>
            </article>
          );
        })}
      </div>

      {/* infinite scroll 觸發器 */}
      {hasMore && (
        <div
          ref={loaderRef}
          className="flex justify-center py-8 text-sm text-muted-foreground"
        >
          {isLoadingMore ? 'Loading more products...' : 'Scroll to load more'}
        </div>
      )}
    </>
  );
}

export default ProductsGridTest;
