'use client';

import { useState, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { toggleFavoriteAction } from '@/utils/actions';
import { FaHeart, FaRegHeart } from 'react-icons/fa6';
import { TbReload } from 'react-icons/tb';
import { CardSignInButton } from '../form/Buttons';
import { useUser } from '@clerk/nextjs';

type Props = {
  productId: string;
  initialFavoriteId?: string | null;
};

type ToggleResult = {
  message: string;
  favoriteId: string | null;
};

export default function FavoriteToggleButton({
  productId,
  initialFavoriteId = null,
}: Props) {
  const pathname = usePathname();

  // 本地 optimistic 狀態
  const [favoriteId, setFavoriteId] = useState<string | null>(
    initialFavoriteId
  );
  const [isPending, startTransition] = useTransition();

  // ✅ 用 Clerk 的 client hook，而不是 server-only currentUser
  const { isLoaded, isSignedIn } = useUser();

  // 還在載入 Clerk 狀態時，可以先不顯示（或顯示 skeleton）
  if (!isLoaded) return null;

  // ❗ 未登入：顯示 SignIn Button，而不是 favorite 按鈕
  if (!isSignedIn) {
    return <CardSignInButton />;
  }

  const isFavorite = !!favoriteId;

  const handleClick = () => {
    // 先樂觀更新
    setFavoriteId((prev) => (prev ? null : 'temp-id'));

    startTransition(async () => {
      const res = (await toggleFavoriteAction({
        productId,
        pathname,
      })) as ToggleResult;

      // 以 server 實際回傳為準（包含真正的 favoriteId 或 null）
      setFavoriteId(res.favoriteId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-md"
    >
      {isPending ? (
        <TbReload className="h-5 w-5 animate-spin" />
      ) : isFavorite ? (
        <FaHeart className="h-5 w-5 text-red-500" />
      ) : (
        <FaRegHeart className="h-5 w-5" />
      )}
    </button>
  );
}
