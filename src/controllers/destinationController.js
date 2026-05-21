const { runNeo4j } = require('../config/neo4j');
const { fileUrl } = require('../utils/fileUrl');
const slugify = require('../utils/slugify');

function filePath(folder, file) {
  return file ? file.url || file.path || file.location || null : null;
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '' || String(value).toLowerCase() === 'nan') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function intOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function splitList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch (_) {}
  return String(value).split(',').map(item => item.trim()).filter(Boolean);
}

function toFullUrl(req, path) {
  if (!path) return '';
  if (String(path).startsWith('http')) return path;
  return fileUrl(req, path);
}

function mapDestination(req, row = {}) {
  const id = row.id || row.nama || '';
  const nama = row.nama || '';
  const kategori = row.kategori || '';
  const wilayah = row.wilayah || '';
  const provinsi = row.provinsi || 'Kalimantan Tengah';
  const mainImage = row.main_image || '';
  const galleryImages = Array.isArray(row.gallery_images) ? row.gallery_images : [];

  return {
    id,
    // field KG
    nama,
    kategori,
    wilayah,
    provinsi,
    alamat: row.alamat || '',
    rating: row.rating ?? 0,
    jumlah_ulasan: row.jumlah_ulasan ?? 0,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    telepon: row.telepon || '',
    website: row.website || '',
    url: row.url || '',
    teks_nlp: row.teks_nlp || '',
    main_image: mainImage,
    main_image_url: toFullUrl(req, mainImage),
    gallery_images: galleryImages,
    gallery_image_urls: galleryImages.map(img => toFullUrl(req, img)),

    // alias agar web admin lama tetap jalan
    title: nama,
    slug: id,
    location: wilayah,
    short_description: row.alamat || row.teks_nlp || '',
    description: row.teks_nlp || '',
    opening_hours: row.opening_hours || '',
    ticket_price: row.ticket_price || '',
    status: row.status || 'published',
    category_id: kategori,
    category_name: kategori,
    category_slug: slugify(kategori),
    facilities: splitList(row.facilities).map((facility_name, index) => ({ id: index + 1, facility_name })),
    images: galleryImages.map((image_url, index) => ({
      id: `${id}__${index}`,
      image_url,
      image_full_url: toFullUrl(req, image_url),
      caption: '',
      is_main: false
    }))
  };
}

async function rowsDestinations(queryTail = '', params = {}) {
  return runNeo4j(`
    MATCH (d:Destinasi)-[:BERKATEGORI]->(k:Kategori)
    MATCH (d)-[:BERLOKASI_DI]->(w:Wilayah)
    ${queryTail}
    RETURN
      d.id AS id,
      d.nama AS nama,
      d.rating AS rating,
      d.jumlah_ulasan AS jumlah_ulasan,
      d.alamat AS alamat,
      d.telepon AS telepon,
      d.website AS website,
      d.url AS url,
      d.latitude AS latitude,
      d.longitude AS longitude,
      d.teks_nlp AS teks_nlp,
      d.main_image AS main_image,
      d.gallery_images AS gallery_images,
      d.facilities AS facilities,
      d.opening_hours AS opening_hours,
      d.ticket_price AS ticket_price,
      coalesce(d.status, 'published') AS status,
      k.nama AS kategori,
      w.nama AS wilayah,
      w.provinsi AS provinsi
    ORDER BY coalesce(toFloat(d.rating), 0) DESC, d.nama ASC
  `, params);
}

async function listPublicDestinations(req, res, next) {
  try {
    const { search, category, kategori, wilayah } = req.query;
    const rows = await rowsDestinations(`
      WHERE ($search IS NULL OR toLower(d.nama) CONTAINS toLower($search) OR toLower(d.alamat) CONTAINS toLower($search) OR toLower(d.teks_nlp) CONTAINS toLower($search))
        AND ($kategori IS NULL OR toLower(k.nama) CONTAINS toLower($kategori))
        AND ($wilayah IS NULL OR toLower(w.nama) CONTAINS toLower($wilayah))
    `, {
      search: search || null,
      kategori: kategori || category || null,
      wilayah: wilayah || null
    });

    res.json({ success: true, data: rows.map(row => mapDestination(req, row)) });
  } catch (error) { next(error); }
}

async function listAdminDestinations(req, res, next) {
  try {
    const rows = await rowsDestinations('', {});
    res.json({ success: true, data: rows.map(row => mapDestination(req, row)) });
  } catch (error) { next(error); }
}

async function getDestination(req, res, next) {
  try {
    const key = req.params.slugOrId;
    const rows = await rowsDestinations(`WHERE d.id = $key OR toLower(d.nama) = toLower($key)`, { key });
    if (!rows.length) return res.status(404).json({ success: false, message: 'Destinasi tidak ditemukan' });
    res.json({ success: true, data: mapDestination(req, rows[0]) });
  } catch (error) { next(error); }
}

async function upsertDestination(id, body, mainImage, galleryImages) {
  const nama = String(body.nama || body.title || '').trim();
  const kategori = String(body.kategori || body.category_id || body.category_name || '').trim();
  const wilayah = String(body.wilayah || body.location || '').trim();

  if (!nama || !kategori || !wilayah) {
    const err = new Error('Nama destinasi, kategori, dan wilayah wajib diisi');
    err.statusCode = 400;
    throw err;
  }

  const destinationId = String(id || body.id || `dest_${Date.now()}`).trim();
  const provinsi = body.provinsi || 'Kalimantan Tengah';
  const alamat = body.alamat || body.short_description || body.location || '';
  const teksNlp = body.teks_nlp || body.description || `${nama} ${kategori} ${wilayah} ${alamat}`.toLowerCase();
  const facilities = splitList(body.facilities);
  const existing = await runNeo4j(`
    MATCH (d:Destinasi {id: $id})
    RETURN d.main_image AS main_image, d.gallery_images AS gallery_images
  `, { id: destinationId });

  const oldMain = existing[0]?.main_image || '';
  const oldGallery = Array.isArray(existing[0]?.gallery_images) ? existing[0].gallery_images : [];
  const finalMain = mainImage || body.main_image || oldMain || '';
  const finalGallery = [...oldGallery, ...galleryImages];

  const rows = await runNeo4j(`
    MERGE (k:Kategori {nama: $kategori})
    MERGE (w:Wilayah {nama: $wilayah})
    SET w.provinsi = $provinsi

    MERGE (d:Destinasi {id: $id})
    SET d.nama = $nama,
        d.rating = $rating,
        d.jumlah_ulasan = $jumlah_ulasan,
        d.alamat = $alamat,
        d.telepon = $telepon,
        d.website = $website,
        d.url = $url,
        d.latitude = $latitude,
        d.longitude = $longitude,
        d.teks_nlp = $teks_nlp,
        d.main_image = $main_image,
        d.gallery_images = $gallery_images,
        d.facilities = $facilities,
        d.opening_hours = $opening_hours,
        d.ticket_price = $ticket_price,
        d.status = $status

    WITH d, k, w
    OPTIONAL MATCH (d)-[oldCat:BERKATEGORI]->(:Kategori)
    DELETE oldCat
    WITH d, k, w
    OPTIONAL MATCH (d)-[oldWil:BERLOKASI_DI]->(:Wilayah)
    DELETE oldWil
    MERGE (d)-[:BERKATEGORI]->(k)
    MERGE (d)-[:BERLOKASI_DI]->(w)

    RETURN
      d.id AS id,
      d.nama AS nama,
      d.rating AS rating,
      d.jumlah_ulasan AS jumlah_ulasan,
      d.alamat AS alamat,
      d.telepon AS telepon,
      d.website AS website,
      d.url AS url,
      d.latitude AS latitude,
      d.longitude AS longitude,
      d.teks_nlp AS teks_nlp,
      d.main_image AS main_image,
      d.gallery_images AS gallery_images,
      d.facilities AS facilities,
      d.opening_hours AS opening_hours,
      d.ticket_price AS ticket_price,
      coalesce(d.status, 'published') AS status,
      k.nama AS kategori,
      w.nama AS wilayah,
      w.provinsi AS provinsi
  `, {
    id: destinationId,
    nama,
    kategori,
    wilayah,
    provinsi,
    alamat,
    telepon: body.telepon || '',
    website: body.website || '',
    url: body.url || '',
    rating: numberOrNull(body.rating) ?? 0,
    jumlah_ulasan: intOrZero(body.jumlah_ulasan),
    latitude: numberOrNull(body.latitude),
    longitude: numberOrNull(body.longitude),
    teks_nlp: teksNlp,
    main_image: finalMain,
    gallery_images: finalGallery,
    facilities,
    opening_hours: body.opening_hours || '',
    ticket_price: body.ticket_price || '',
    status: body.status || 'published'
  });

  return rows[0];
}

async function createDestination(req, res, next) {
  try {
    const mainImage = filePath('destinations', req.files?.main_image?.[0]);
    const galleryImages = (req.files?.gallery_images || []).map(file => filePath('destinations', file));
    const row = await upsertDestination(null, req.body, mainImage, galleryImages);
    res.status(201).json({ success: true, message: 'Destinasi KG berhasil ditambahkan', data: mapDestination(req, row) });
  } catch (error) { next(error); }
}

async function updateDestination(req, res, next) {
  try {
    const mainImage = filePath('destinations', req.files?.main_image?.[0]);
    const galleryImages = (req.files?.gallery_images || []).map(file => filePath('destinations', file));
    const row = await upsertDestination(req.params.id, req.body, mainImage, galleryImages);
    res.json({ success: true, message: 'Destinasi KG berhasil diperbarui', data: mapDestination(req, row) });
  } catch (error) { next(error); }
}

async function deleteDestination(req, res, next) {
  try {
    await runNeo4j(`MATCH (d:Destinasi {id: $id}) DETACH DELETE d`, { id: req.params.id });
    res.json({ success: true, message: 'Destinasi KG berhasil dihapus' });
  } catch (error) { next(error); }
}

async function deleteDestinationImage(req, res, next) {
  try {
    const [id, indexRaw] = String(req.params.imageId).split('__');
    const index = Number(indexRaw);

    if (!id || !Number.isInteger(index)) {
      return res.status(400).json({ success: false, message: 'ID gambar tidak valid' });
    }

    await runNeo4j(`
      MATCH (d:Destinasi {id: $id})
      WITH d, coalesce(d.gallery_images, []) AS imgs
      SET d.gallery_images = imgs[0..$index] + imgs[($index + 1)..]
      RETURN d.id AS id
    `, { id, index });

    res.json({ success: true, message: 'Foto galeri KG berhasil dihapus' });
  } catch (error) { next(error); }
}

module.exports = {
  listPublicDestinations,
  listAdminDestinations,
  getDestination,
  createDestination,
  updateDestination,
  deleteDestination,
  deleteDestinationImage
};
