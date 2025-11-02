import { fetchFeaturedProducts } from '@/utils/actions';
import { Product } from '@prisma/client';
import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { toImageSrc } from '@/lib/image-url';

const HeroCarousel = async () => {
  const featuredProduct: Product[] = await fetchFeaturedProducts();
  const carouselImages = featuredProduct.map((product) => product.image);
  return (
    <div className="hidden lg:block">
      <Carousel>
        <CarouselContent>
          {carouselImages.map((image, index) => {
            const src = toImageSrc(image);
            return (
              <CarouselItem key={index}>
                <Card>
                  <CardContent className="p-2">
                    <Image
                      src={src}
                      alt="hero"
                      width={1920}
                      height={1080}
                      priority
                      className="w-full h-[24rem] rounded-md object-cover"
                    />
                  </CardContent>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default HeroCarousel;
