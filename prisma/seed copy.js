const IMAGE_SOURCE_DIR = 'C:/Users/USER/Desktop/smallerImages';
/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const products = require('./Bodenbelag.json');
const sharp = require('sharp');

const prisma = new PrismaClient();

/** 目標公開資料夾 */
// 專案根目錄（prisma 的上一層）
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 正確的 public 路徑（與 prisma 同層）
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const IMAGE_DEST_DIR = path.join(PUBLIC_DIR, 'images');

/** 你在 product.ts 設為 number 的欄位（可依實際 schema 增減） */
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

/** 優先副檔名（同一個 stem 有多檔時的選擇順序） */
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

/** 產生 [20,200] 的整數 */
function rand20to200() {
  return Math.floor(Math.random() * (200 - 20 + 1)) + 20;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * 遞迴掃描圖片根目錄，建立：{ lowerCaseStem -> [absolutePaths...] }
 * 例如：/a/b/IMG_1234.JPG 與 /c/d/img_1234.png 都會被歸到 key "img_1234"
 */
function buildImageIndexByStem(rootDir) {
  const index = new Map();

  function pushStem(stem, absPath) {
    const key = stem.toLowerCase();
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(absPath);
  }

  function walk(dir) {
    const entries = fs.existsSync(dir)
      ? fs.readdirSync(dir, { withFileTypes: true })
      : [];
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

/** 從 foto1 擷取「檔名主體（不含副檔名）」；你的 foto1 一定含 /DCIM/ */
function extractStemFromFoto1(foto1) {
  if (!foto1) return '';
  // 取出最後一段檔名，然後去除副檔名
  const base = path.basename(String(foto1));
  return path.parse(base).name || '';
}

/** 依 stem 從索引挑一個最佳檔案（照 EXT_PRIORITY 排序） */
function pickBestImageForStem(stem, index) {
  const candidates = index.get(stem.toLowerCase());
  if (!candidates || candidates.length === 0) return null;

  // 先依副檔名優先序排序，再回傳第一個
  const sorted = candidates.slice().sort((a, b) => {
    const ea = path.extname(a).toLowerCase();
    const eb = path.extname(b).toLowerCase();
    return EXT_PRIORITY.indexOf(ea) - EXT_PRIORITY.indexOf(eb);
  });
  return sorted[0];
}

/** 數值欄位：字串->number；空/非數字用亂數補 */
function coerceNumbers(product) {
  const cleaned = { ...product };
  for (const key of NUMBER_FIELDS) {
    const v = cleaned[key];
    const n = typeof v === 'string' ? Number(v.trim()) : Number(v);
    cleaned[key] = Number.isFinite(n) ? n : rand20to200();
  }
  return cleaned;
}

/** 把「原始 JSON 格式」轉成「符合 productSchema 的物件雛形」 */
function normalizeOriginalToProductShape(original) {
  // 這裡做欄位對應（key rename）與新增欄位
  // 依你的實際 schema 修改
  const base = {
    name: undefined,
    bauteil_obergruppe: original.bauteil_obergruppe,
    bauteil_gruner: original.bauteil_gruner,
    zustand: original.zustand,
    material: original.material,
    ref_gebauede_geschoss: original.ref_gebauede_geschoss,
    breite: original.breite,
    hoehe: original.hoehe,
    tiefe: original.tiefe,
    flaeche: original.flaeche,
    masse: original.masse,
    anzahl: original.anzahl,
    price: original.kosten,
    // 補你需要的新欄位（先留空，稍後補）
    clerkId: 'clerkId',
    image: undefined,
    featured: false,
    description: undefined,
  };
  return base;
}

/** 複製並縮小圖片到 /public/images，回傳公開路徑 /images/xxx.ext */
async function copyAndResizeImage(absSrcPath, preferredName) {
  ensureDir(IMAGE_DEST_DIR);

  const ext = path.extname(absSrcPath).toLowerCase();
  const safeBase = (preferredName || path.basename(absSrcPath, ext)).replace(
    /[^\w-]/g,
    ''
  );
  let finalName = `${safeBase}${ext}`;
  let counter = 1;
  while (fs.existsSync(path.join(IMAGE_DEST_DIR, finalName))) {
    finalName = `${safeBase}-${counter}${ext}`;
    counter += 1;
  }
  const destPath = path.join(IMAGE_DEST_DIR, finalName);

  // 讀取圖片 metadata
  const image = sharp(absSrcPath);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  // 判斷是否需要縮小
  if (width && height && (width > 1000 || height > 800)) {
    // 若圖片太大就縮小一半或四分之一
    const scale = width > 1600 ? 0.25 : 0.5;
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);
    await image.resize(newWidth, newHeight).toFile(destPath);
    console.log(
      `📏 Resized ${path.basename(absSrcPath)} → ${newWidth}×${newHeight}`
    );
  } else {
    // 小圖不縮
    fs.copyFileSync(absSrcPath, destPath);
  }

  return `/images/${finalName}`;
}

/** 生成 80~120 單字的 lorem-style description */
function generateLoremDescription(minWords = 80, maxWords = 120) {
  const loremBase = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    Integer euismod, augue id cursus sagittis, libero nulla hendrerit lacus,
    a imperdiet augue sem ac justo. Sed facilisis, risus non tincidunt pulvinar,
    felis elit cursus nulla, eget facilisis leo nunc vitae lectus.
    Praesent vel lectus ut nisl volutpat egestas.
    Duis vitae magna in nulla consectetur porta sit amet nec eros.
    Morbi eget vestibulum neque. Aenean ac tincidunt justo.
    Aliquam erat volutpat. Vivamus ac massa et mi sagittis venenatis.
    Quisque luctus, felis nec efficitur hendrerit, mi dolor pretium velit,
    ut aliquam orci nunc ut elit. Proin id dignissim tortor.
    Vestibulum eget lectus a mauris lacinia sollicitudin.
    Ut tristique, sapien nec porta tincidunt, justo orci pretium velit,
    at sodales risus sem eget nulla. Nullam at mauris et nulla interdum fermentum.
    Sed suscipit justo et magna porttitor, vel pretium neque malesuada.`;

  // 切成單字
  const words = loremBase.replace(/[.,]/g, '').split(/\s+/).filter(Boolean);

  const wordCount =
    Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;

  // 循環取詞組成段落
  let description = [];
  for (let i = 0; i < wordCount; i++) {
    const w = words[i % words.length];
    description.push(w);
  }

  // 每約 12~18 個單字插入句號
  const text = description
    .map((w, i) => {
      const end =
        (i + 1) % (12 + Math.floor(Math.random() * 6)) === 0 ? '. ' : ' ';
      return w + end;
    })
    .join('');

  // 開頭首字大寫
  return text.charAt(0).toUpperCase() + text.slice(1).trim();
}

async function main() {
  console.log('🔎 Scanning image tree:', IMAGE_SOURCE_DIR);
  const imgIndex = buildImageIndexByStem(IMAGE_SOURCE_DIR);
  console.log(`📦 Indexed stems: ${imgIndex.size}`);

  let created = 0;
  let skipped = 0;

  for (const original of products) {
    // 1) 由 foto1 擷取 stem（不含副檔名）；你的 foto1 路徑一定有 /DCIM/
    const stem = extractStemFromFoto1(original.foto1);
    if (!stem) {
      skipped += 1;
      continue;
    }

    // 2) 用 stem 在索引中找檔案（任何副檔名）
    const absImg = pickBestImageForStem(stem, imgIndex);
    if (!absImg) {
      // 找不到圖就跳過該 product
      skipped += 1;
      continue;
    }

    const newShapeData = normalizeOriginalToProductShape(original);

    // 3) 複製到 public/images（優先用 uuid 當檔名避免重名）
    const preferred = newShapeData.uuid || stem;
    const publicPath = await copyAndResizeImage(absImg, preferred);

    // 4) 清洗數值欄位
    const cleaned = coerceNumbers(newShapeData);

    // 5) 覆蓋 image 欄位
    cleaned.image = publicPath;

    //補充
    cleaned.featured = created < 5;
    cleaned.name = `${cleaned.bauteil_gruner}-${cleaned.breite}x${cleaned.hoehe}x${cleaned.tiefe}`;
    cleaned.description = generateLoremDescription();

    // 6) 寫入 DB
    await prisma.product.create({ data: cleaned });
    console.log(created);
    console.log(cleaned.featured);
    created += 1;
  }

  console.log(
    `✅ Created ${created} products, ⏭️ Skipped ${skipped} (no image found)`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
