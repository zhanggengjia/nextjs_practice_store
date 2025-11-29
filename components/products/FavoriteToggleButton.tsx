'use client';

import { useEffect, useState, useTransition } from 'react';
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

  // ✅ 只讓真正「掛載後」才去根據 useUser 決定要顯示什麼
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Clerk hook – 但第一次 render 不會用它來決定 JSX
  const { isLoaded, isSignedIn } = useUser();

  // 🔑 重點：SSR & Client 第一次 render 都回傳 null
  // -> DOM 完全一致，不會 hydration mismatch
  if (!isMounted) {
    return null;
  }

  // 這之後就只會在 client 上運作，不牽涉 hydration
  if (!isLoaded) {
    // 你可以改成 skeleton / spinner，如果想要
    return null;
  }

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
