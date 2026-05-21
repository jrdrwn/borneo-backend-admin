let ImageKitCtor = null;

try {
  ({ ImageKit: ImageKitCtor } = require('@imagekit/nodejs'));
} catch (_) {}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} wajib diisi untuk upload ImageKit`);
  }
  return value;
}

let imagekit = null;

function getImageKit() {
  if (imagekit) return imagekit;
  if (!ImageKitCtor) {
    throw new Error('Package @imagekit/nodejs belum terpasang. Jalankan npm install di folder backend.');
  }

  imagekit = new ImageKitCtor({
    publicKey: requiredEnv('IMAGEKIT_PUBLIC_KEY'),
    privateKey: requiredEnv('IMAGEKIT_PRIVATE_KEY'),
    urlEndpoint: requiredEnv('IMAGEKIT_URL_ENDPOINT')
  });

  return imagekit;
}

function normalizeFolder(folderName = '') {
  return String(folderName || process.env.IMAGEKIT_FOLDER || '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .trim();
}

function buildUploadFolder(folderName = '') {
  const baseFolder = normalizeFolder(process.env.IMAGEKIT_FOLDER || '');
  const featureFolder = normalizeFolder(folderName || '');

  if (baseFolder && featureFolder) return `${baseFolder}/${featureFolder}`;
  return baseFolder || featureFolder;
}

function safeBaseName(originalName = 'image') {
  const name = String(originalName).trim();
  const lastDot = name.lastIndexOf('.');
  const rawBase = lastDot > 0 ? name.slice(0, lastDot) : name;
  const rawExt = lastDot > 0 ? name.slice(lastDot).toLowerCase() : '';
  const base = rawBase.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'image';
  return `${base}${rawExt}`;
}

async function uploadBufferToImageKit(file, folderName = '') {
  if (!file || !file.buffer) {
    return null;
  }

  const folder = buildUploadFolder(folderName);
  const fileName = `${Date.now()}-${safeBaseName(file.originalname)}`;
  const result = await getImageKit().upload({
    file: file.buffer.toString('base64'),
    fileName,
    useUniqueFileName: true,
    ...(folder ? { folder } : {})
  });

  return {
    ...file,
    ...result,
    imagekit_url_endpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
    imagekit_folder: folder,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  };
}

module.exports = { uploadBufferToImageKit };