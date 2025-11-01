// supabase.ts
import { createClient } from '@supabase/supabase-js';

export const bucket = 'main-bucket';

export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string // 伺服器端請用 SERVICE_ROLE_KEY
);

// 產生 users/<uid>/<ts>-<安全檔名>
export function buildObjectPath(userId: string, fileName: string) {
  const safe = (fileName || 'upload').replace(/[^\w.-]+/g, '_');
  return `users/${userId}/${Date.now()}-${safe}`;
}

/** 上傳圖片 -> 回傳 objectPath（DB 就存這個字串） */
export async function uploadImage(file: File, userId: string) {
  if (!file || file.size === 0) throw new Error('No file to upload');

  const objectPath = buildObjectPath(userId, file.name).replace(/^\/+/, '');
  const { error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  // 只回傳字串，方便直接存到 Prisma 的 image: string
  return objectPath; // <-- 這就是你要存進 DB 的字串
}

/** （可選）顯示時需要 URL 再轉：public 就 getPublicUrl，private 用 createSignedUrl */
export function getPublicUrl(objectPath: string) {
  return supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
}
export async function createSignedUrl(objectPath: string, seconds = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, seconds);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

/** 刪除時用：直接丟 objectPath（字串） */
export async function deleteImage(objectPath: string) {
  const path = objectPath.replace(/^\/+/, '');
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}
