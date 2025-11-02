// lib/image-url.ts
/**
 * 將圖片欄位統一轉成 next/image 可用的 src。
 * 僅支援兩種輸入：
 * 1) 以 `/images/` 開頭（public 資料夾）
 * 2) Supabase Storage 物件路徑（例如：user_abc/123.jpg）
 *
 * 若輸入已是 http(s) 絕對網址，則直接回傳。
 */

const DEFAULT_PLACEHOLDER = '/images/placeholder.jpg';
const DEFAULT_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'main-bucket';

// 去掉尾端多餘斜線，避免拼接出現 `//storage/...`
const SUPABASE_BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(
  /\/+$/,
  ''
);

export function toImageSrc(image?: string | null): string {
  // 1) 空值 → 統一給占位圖
  if (!image) return DEFAULT_PLACEHOLDER;

  // 2) 已是絕對網址 → 直接用（remotePatterns 需允許此網域）
  if (/^https?:\/\//i.test(image)) return image;

  // 3) public 圖片（/images/...）→ 直接回傳
  if (image.startsWith('/images/')) return image;

  // 4) 剩下視為「Supabase 物件路徑」（例如：user_.../file.jpg）
  if (!SUPABASE_BASE) {
    // 在 dev 提早暴露設定問題；正式環境你也可改回傳占位圖
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL 未設定，無法組出 Supabase 圖片 URL。'
    );
  }

  const cleanObjectPath = image.replace(/^\/+/, ''); // 保險：移除開頭斜線
  return `${SUPABASE_BASE}/storage/v1/object/public/${DEFAULT_BUCKET}/${cleanObjectPath}`;
}

/** 判斷是否為 public 圖 */
export function isPublicImage(src?: string | null): boolean {
  return !!src && src.startsWith('/images/');
}

/** 判斷是否為 Supabase 物件路徑（不是 / 開頭、也不是 http(s)） */
export function isSupabaseObjectPath(src?: string | null): boolean {
  return !!src && !src.startsWith('/') && !/^https?:\/\//i.test(src);
}
