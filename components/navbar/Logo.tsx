import React from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { LuArmchair } from 'react-icons/lu';
import { FaRecycle } from 'react-icons/fa';

function Logo() {
  return (
    <Button size="default" asChild>
      <Link href="/" className="w-50">
        <FaRecycle className="size-6" />
        <div className="text-2xl font-bold text-green-500">
          Mat<span className="text-background">Hub</span>
        </div>
      </Link>
    </Button>
  );
}

export default Logo;
