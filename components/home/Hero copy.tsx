import { fetchFeaturedProducts } from '@/utils/actions';
import { Product } from '@prisma/client';

type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;

async function Hero() {
  const products: Product[] = await fetchFeaturedProducts();
  const productsQuantity = products.length;

  const sliderStyle: CSSVars = { '--quantity': productsQuantity };
  return (
    <>
      <div className="banner">
        <div className="slider" style={sliderStyle}>
          {products.map((product, index) => (
            <div
              className="item"
              key={product.id}
              style={{ '--position': index + 1 } as CSSVars}
            >
              <img src={product.image} alt="" />
            </div>
          ))}
        </div>
        <div className="content">
          <h1>CSS ONLY</h1>
          <div className="author">
            <h2>Kevin</h2>
            <p>
              <b>Web Design</b>
            </p>
            <p>Hello world</p>
          </div>
          <div className="model"></div>
        </div>
      </div>
    </>
  );
}

export default Hero;
