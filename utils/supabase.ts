import { createClient } from '@supabase/supabase-js';

export const bucket = 'main-bucket';

export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// 產生 users/<uid>/<ts>-<安全檔名>
export function buildObjectPath(userId: string, fileName: string) {
  const safe = (fileName || 'upload').replace(/[^\w.-]+/g, '_');
  return `${userId}/${Date.now()}-${safe}`;
}

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

  return objectPath;
}

/** 刪除時用：直接丟 objectPath（字串） */
export async function deleteImage(objectPath: string) {
  const path = objectPath.replace(/^\/+/, '');
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}
