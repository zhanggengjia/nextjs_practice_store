import BreadCrumbs from '@/components/single-product/BreadCrumbs';
import { fetchSingleProduct } from '@/utils/actions';
import Image from 'next/image';
import { formatCurrency } from '@/utils/format';
import FavoriteToggleButton from '@/components/products/FavoriteToggleButton';
import AddToCart from '@/components/single-product/AddToCart';
import ProductRating from '@/components/single-product/ProductRating';
import { toImageSrc } from '@/lib/image-url';

async function SingleProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await fetchSingleProduct(id);
  const {
    name,
    image,
    material,
    bauteil_obergruppe,
    bauteil_gruner,
    zustand,
    ref_gebauede_geschoss,
    breite,
    hoehe,
    tiefe,
    flaeche,
    masse,
    anzahl,
    price,
    co2,
    description,
  } = product;
  const src = toImageSrc(image);
  const dollarsAmount = formatCurrency(price);
  return (
    <section>
      <BreadCrumbs name={product.name} />
      <div className="mt-6 grid gap-y-8 lg:grid-cols-2 lg:gap-x-16">
        <div>
          <div className="relative w-full aspect-[4/3]">
            <Image
              src={src}
              alt={name}
              fill
              sizes="(max-width:768px) 100vw,(max-width:1200px) 50vw, 33vw"
              priority
              className="w-full rounded object-cover"
            />
          </div>
          <p className="mt-6 leading-8 text-muted-foreground">{description}</p>
        </div>
        <div>
          <div className="flex gap-x-8 items-center">
            <h1 className="capitalize text-3xl font-bold">{name}</h1>
            <FavoriteToggleButton productId={id} />
          </div>
          <ProductRating productId={id} />
          <h4 className="text-xl mt-2">{ref_gebauede_geschoss}</h4>
          <p className="mt-3 text-md bg-muted inline-block p-2 rounded-md">
            {dollarsAmount}
          </p>
          <Info text={'Material'} data={material} />
          <Info text={'Upper group component'} data={bauteil_obergruppe} />
          <Info text={'Gruner component'} data={bauteil_gruner} />
          <Info text={'condition'} data={zustand} />
          <Info text={'Size (WxHxD)'} data={`${breite}x${hoehe}x${tiefe}`} />
          <Info text={'Area'} data={flaeche} />
          <Info text={'Weight'} data={masse} />
          <Info text={'Quantity'} data={anzahl} />
          <Info text={'Co2'} data={co2} />
          <AddToCart productId={id} />
        </div>
      </div>
    </section>
  );
}

function Info({ text, data }: { text: string; data: string | number }) {
  return (
    <p className="mt-6 leading-8 text-primary capitalize">
      {text}: <span className="text-muted-foreground">{data}</span>
    </p>
  );
}

export default SingleProductPage;
