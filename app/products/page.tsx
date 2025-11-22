import LoadingContainer from '@/components/global/LoadingContainer';
import ProductsContainer from '@/components/products/ProductsContainer';
import { Suspense } from 'react';

async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ layout?: string; search?: string }>;
}) {
  const params = await searchParams;
  const layout = params.layout || 'grid';
  const search = params.search || '';
  return (
    <>
      <Suspense fallback={<LoadingContainer />}>
        <ProductsContainer layout={layout} search={search} />
      </Suspense>
    </>
  );
}

export default ProductsPage;
