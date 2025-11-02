/* prisma/seed.js — clean version */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/* ======== ENV / CONFIG ======== */
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'main-bucket';
const FOLDER = process.env.SUPABASE_FOLDER || 'products';
const IMAGE_SOURCE_DIR =
  process.env.IMAGE_SOURCE_DIR || 'C:/Users/USER/Desktop/smallerImages';

/* 你的原始資料檔（依實際檔名修改） */
const products = require('./Bodenbelag.json');

/* 允許的圖片副檔名排序（優先用前面的） */
const EXT_PRIORITY = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.tif',
  '.tiff',
  '.bmp',
];

/* 需要轉成數字的欄位（依你的 schema 調整） */
const NUMBER_FIELDS = [
  'breite',
  'hoehe',
  'tiefe',
  'flaeche',
  'masse',
  'anzahl',
  'co2',
  'price',
];

/* ======== Supabase client（以動態 import 取得 ESM） ======== */
let _supabase = null;
async function getSupabase() {
  if (_supabase) return _supabase;
  const { createClient } = await import('@supabase/supabase-js');
  _supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  return _supabase;
}

/* ======== Utils ======== */
function rand20to200() {
  return Math.floor(Math.random() * 181) + 20;
}

/* 遞迴掃描圖片目錄：建立 { stem(小寫) -> [absPath...] } 索引 */
function buildImageIndexByStem(rootDir) {
  const index = new Map();

  function pushStem(stem, abs) {
    const key = stem.toLowerCase();
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(abs);
  }

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else {
        const ext = path.extname(e.name).toLowerCase();
        if (EXT_PRIORITY.includes(ext)) {
          const stem = path.basename(e.name, ext);
          pushStem(stem, full);
        }
      }
    }
  }

  walk(rootDir);
  return index;
}

/* 從 foto1 抓出檔名主體（不含副檔名） */
function extractStemFromFoto1(foto1) {
  if (!foto1) return '';
  const base = path.basename(String(foto1));
  return path.parse(base).name || '';
}

/* 依副檔名優先序挑一張 */
function pickBestImageForStem(stem, index) {
  const list = index.get(stem.toLowerCase());
  if (!list || !list.length) return null;
  return list
    .slice()
    .sort(
      (a, b) =>
        EXT_PRIORITY.indexOf(path.extname(a).toLowerCase()) -
        EXT_PRIORITY.indexOf(path.extname(b).toLowerCase())
    )[0];
}

/* 產生不重複的檔名 */
async function makeUniqueName(baseName, ext, existsFn) {
  const safeBase = String(baseName).replace(/[^\w-]/g, '') || 'img';
  let name = `${safeBase}${ext}`;
  let i = 1;
  while (await existsFn(name)) {
    name = `${safeBase}-${i}${ext}`;
    i += 1;
  }
  return name;
}

/* 檢查 Storage 中是否已存在同名檔案（用 list 搜索） */
async function pathExistsInBucket(fileName) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(FOLDER, { search: fileName, limit: 1 });
  if (error) return false;
  return Array.isArray(data) && data.some((f) => f.name === fileName);
}

/* 讀檔→必要時縮圖→回傳 {buffer, contentType, ext} */
async function resizeToBuffer(absSrcPath) {
  const ext = path.extname(absSrcPath).toLowerCase() || '.jpg';
  const contentType =
    {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    }[ext] || 'application/octet-stream';

  const img = sharp(absSrcPath);
  const meta = await img.metadata();

  if (meta.width && meta.height && (meta.width > 1000 || meta.height > 800)) {
    const scale = meta.width > 1600 ? 0.25 : 0.5;
    const newWidth = Math.round(meta.width * scale);
    const buffer = await img.resize(newWidth).toBuffer();
    return { buffer, contentType, ext };
  }
  const buffer = await fs.promises.readFile(absSrcPath);
  return { buffer, contentType, ext };
}

/* 縮圖＋上傳 Storage；Public bucket 回傳 public URL，Private 回傳 storage path */
async function uploadImageToSupabase(absSrcPath, preferredName) {
  const supabase = await getSupabase();
  const { buffer, contentType, ext } = await resizeToBuffer(absSrcPath);

  const base = preferredName || path.basename(absSrcPath, ext);
  const fileName = await makeUniqueName(base, ext, pathExistsInBucket);
  const storagePath = `${FOLDER}/${fileName}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: false });
  if (upErr) throw upErr;

  // Public bucket 直接回傳 URL；Private bucket 請只存 path（之後產生簽名網址）
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data?.publicUrl || storagePath;
}

/* 將原始物件轉為 product 的基本 shape（照你的 schema 對應） */
function normalizeOriginalToProductShape(o) {
  return {
    name: undefined,
    bauteil_obergruppe: o.bauteil_obergruppe,
    bauteil_gruner: o.bauteil_gruner,
    zustand: o.zustand,
    material: o.material,
    ref_gebauede_geschoss: o.ref_gebauede_geschoss,
    breite: o.breite,
    hoehe: o.hoehe,
    tiefe: o.tiefe,
    flaeche: o.flaeche,
    masse: o.masse,
    anzahl: o.anzahl,
    price: o.kosten, // 依你的資料欄位
    clerkId: 'clerkId', // seeding 可先放固定值
    image: undefined,
    featured: false,
    description: undefined,
  };
}

/* 數字欄位清洗（空值/非數字則隨機補一個合理值） */
function coerceNumbers(p) {
  const out = { ...p };
  for (const k of NUMBER_FIELDS) {
    const v = out[k];
    const n = typeof v === 'string' ? Number(v.trim()) : Number(v);
    out[k] = Number.isFinite(n) ? n : rand20to200();
  }
  return out;
}

/* 生成 80~120 單字的假文描述 */
function generateLoremDescription(min = 80, max = 120) {
  const base =
    'Lorem ipsum dolor sit amet consectetur adipiscing elit Integer euismod augue id cursus sagittis libero nulla hendrerit lacus a imperdiet augue sem ac justo Sed facilisis risus non tincidunt pulvinar felis elit cursus nulla eget facilisis leo nunc vitae lectus Praesent vel lectus ut nisl volutpat egestas Duis vitae magna in nulla consectetur porta sit amet nec eros Morbi eget vestibulum neque Aenean ac tincidunt justo Aliquam erat volutpat Vivamus ac massa et mi sagittis venenatis Quisque luctus felis nec efficitur hendrerit mi dolor pretium velit ut aliquam orci nunc ut elit Proin id dignissim tortor Vestibulum eget lectus a mauris lacinia sollicitudin Ut tristique sapien nec porta tincidunt justo orci pretium velit at sodales risus sem eget nulla Nullam at mauris et nulla interdum fermentum Sed suscipit justo et magna porttitor vel pretium neque malesuada';
  const words = base.split(/\s+/).filter(Boolean);
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const arr = [];
  for (let i = 0; i < count; i++) arr.push(words[i % words.length]);
  const txt = arr
    .map(
      (w, i) =>
        w + ((i + 1) % (12 + Math.floor(Math.random() * 6)) === 0 ? '. ' : ' ')
    )
    .join('')
    .trim();
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

/* ======== MAIN ======== */
async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 未設定');
  }

  console.log('🔎 Scanning image tree:', IMAGE_SOURCE_DIR);
  const imgIndex = buildImageIndexByStem(IMAGE_SOURCE_DIR);
  console.log('📦 Indexed stems:', imgIndex.size);

  let created = 0;
  let skipped = 0;

  for (const original of products) {
    const stem = extractStemFromFoto1(original.foto1);
    if (!stem) {
      skipped += 1;
      continue;
    }

    const absImg = pickBestImageForStem(stem, imgIndex);
    if (!absImg) {
      skipped += 1; // 找不到對應圖片就跳過
      continue;
    }

    const baseShape = normalizeOriginalToProductShape(original);
    const preferred = baseShape.uuid || stem;

    // 上傳圖片到 Supabase（依 bucket 公開性回傳 URL 或 path）
    const imgUrlOrPath = await uploadImageToSupabase(absImg, preferred);

    // 清洗數字欄位
    const cleaned = coerceNumbers(baseShape);
    cleaned.image = imgUrlOrPath;

    // 前 5 筆標記 featured
    cleaned.featured = created < 5;

    // name 舉例：用 bauteil_gruner + 尺寸
    cleaned.name = `${cleaned.bauteil_gruner || 'Item'}-${cleaned.breite}x${
      cleaned.hoehe
    }x${cleaned.tiefe}`;

    // description 假文補齊
    cleaned.description = generateLoremDescription();

    // 寫入 DB
    await prisma.product.create({ data: cleaned });
    created += 1;
  }

  console.log(
    `✅ Created ${created} products, ⏭️ Skipped ${skipped} (no image found)`
  );
}

/* ======== RUN ======== */
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
