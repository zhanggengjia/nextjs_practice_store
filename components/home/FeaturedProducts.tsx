// components/home/FeaturedProducts.tsx
import { fetchFeaturedProducts, fetchProductsPage } from '@/utils/actions';
import ProductsGrid from '@/components/products/ProductsGrid';
import { Product } from '@prisma/client';
// import ProductsList from '@/components/products/ProductsList';

export default async function FeaturedProducts() {
  // 拿第一頁產品，pageSize 可以自己決定
  // const { products } = await fetchProductsPage({
  //   search: '',
  //   page: 1,
  //   pageSize: 12, // 或 6、8 都可以
  // });

  const featured = await fetchFeaturedProducts();

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold mb-6">Featured products</h2>

      <ProductsGrid
        initialProducts={featured}
        search="" // 首頁通常沒有搜尋
        totalProducts={featured.length}
        pageSize={featured.length}
      />
      {/* 如果想用 List 版就改成： */}
      {/* <ProductsList
        initialProducts={featured}
        search=""
        totalProducts={featured.length}
        pageSize={featured.length}
      /> */}
    </section>
  );
}
