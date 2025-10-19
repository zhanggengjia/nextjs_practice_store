import Link from 'next/link';
import { Button } from '@/components/ui/button';
import HeroCarousel from './HeroCarousel';

const Hero = () => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
      <div>
        <h1 className="max-w-2xl font-bold text-4xl tracking-tight sm:text-6xl">
          Design sustainably. Build intelligently.
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-8">
          A web platform connecting designers with reusable building materials
          from soon-to-be-demolished structures — powered by Next.js,
          TypeScript, and Supabase/PostgreSQL to make material reuse searchable,
          data-driven, and collaborative.
        </p>
        <Button asChild size="lg" className="mt-10">
          <Link href="/products">Our Products</Link>
        </Button>
      </div>
      <HeroCarousel />
    </section>
  );
};

export default Hero;
