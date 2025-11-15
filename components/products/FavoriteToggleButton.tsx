'use client';

import { SignedIn, SignedOut } from '@clerk/nextjs';
import { CardSignInButton } from '../form/Buttons';
import FavoriteToggleForm from '../form/FavoriteToggleForm';

type Props = {
  productId: string;
  initialFavoriteId: string | null;
};

function FavoriteToggleButton({ productId, initialFavoriteId }: Props) {
  return (
    <>
      <SignedOut>
        <CardSignInButton />
      </SignedOut>
      <SignedIn>
        <FavoriteToggleForm
          favoriteId={initialFavoriteId}
          productId={productId}
        />
      </SignedIn>
    </>
  );
}

export default FavoriteToggleButton;
