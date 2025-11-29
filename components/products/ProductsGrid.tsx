'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Product } from '@prisma/client';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '../ui/card';
import { formatCurrency } from '@/utils/format';
import FavoriteToggleButton from './FavoriteToggleButton';
import { toImageSrc } from '@/lib/image-url';

type ProductWithFavoriteId = Product & {
  favoriteId: string | null;
};

type ProductsGridProps = {
  initialProducts: ProductWithFavoriteId[];
  search: string;
  totalProducts: number;
  pageSize: number;
};

function ProductsGrid({
  initialProducts,
  search = '',
  totalProducts = Infinity,
  pageSize = 12,
}: ProductsGridProps) {
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

    const params = new URLSearchParams({
      page: String(nextPage),
      pageSize: String(pageSize),
    });
    if (search) {
      params.set('search', search);
    }

    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) return;

      const data = (await res.json()) as {
        products: ProductWithFavoriteId[];
        totalProducts: number;
      };

      setProducts((prev) => {
        const merged = [...prev, ...data.products];
        setHasMore(merged.length < data.totalProducts);
        return merged;
      });

      setPage(nextPage);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, pageSize, search]);

  useEffect(() => {
    if (!hasMore) return;
    const node = loaderRef.current;
    if (!node) return;

    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting) {
        loadMore();
      }
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  return (
    <>
      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const {
            id: productId,
            name,
            price,
            image,
            material,
            favoriteId,
          } = product;
          const src = toImageSrc(image);
          const dollarsAmount = formatCurrency(price);

          return (
            <article key={productId} className="group relative">
              <Link href={`/products/${productId}`}>
                <Card className="transform group-hover:shadow-xl transition-shadow duration-500 !pt-0">
                  <CardContent className="!p-4">
                    <div className="relative h-64 md:h-48 rounded overflow-hidden">
                      <Image
                        src={src}
                        alt={name}
                        fill
                        sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                        className="rounded w-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        priority
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <h2 className="text-lg font-semibold capitalize">
                          {name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {material}
                        </p>
                      </div>
                      <p className="text-base text-muted-foreground">
                        {dollarsAmount}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
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

export default ProductsGrid;
