import SectionTitle from '@/components/global/SectionTitle';
import ProductsGrid from '@/components/products/ProductsGrid';
import { fetchUserFavorites } from '@/utils/actions';
import React from 'react';
import type { Product } from '@prisma/client';

type ProductWithFavoriteId = Product & {
  favoriteId: string | null;
};

async function FavoritesPage() {
  const favorites = await fetchUserFavorites();
  if (favorites.length === 0)
    return <SectionTitle text="You have no favorites yet." />;

  // 每個 favorite 只對應一個 product，favorite.id 就是這個 product 的 favoriteId
  const products: ProductWithFavoriteId[] = favorites.map((favorite) => ({
    ...favorite.product,
    favoriteId: favorite.id,
  }));

  return (
    <div>
      <SectionTitle text="Favorites" />
      <ProductsGrid
        initialProducts={products}
        search=""
        totalProducts={products.length}
        pageSize={products.length}
      />
    </div>
  );
}

export default FavoritesPage;
