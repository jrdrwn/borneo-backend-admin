const { runNeo4j } = require('../config/neo4j');
const slugify = require('../utils/slugify');

function mapCategory(row) {
  const name = row.nama || row.name || '';
  return {
    id: name,
    name,
    nama: name,
    slug: slugify(name),
    description: row.description || '',
    icon: row.icon || 'map',
    status: row.status || 'active'
  };
}

async function listCategories(req, res, next) {
  try {
    const rows = await runNeo4j(`
      MATCH (k:Kategori)
      RETURN k.nama AS nama,
             coalesce(k.description, '') AS description,
             coalesce(k.icon, 'map') AS icon,
             coalesce(k.status, 'active') AS status
      ORDER BY k.nama ASC
    `);
    res.json({ success: true, data: rows.map(mapCategory) });
  } catch (error) { next(error); }
}

async function createCategory(req, res, next) {
  try {
    const name = String(req.body.name || req.body.nama || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });

    const rows = await runNeo4j(`
      MERGE (k:Kategori {nama: $name})
      SET k.description = $description,
          k.icon = $icon,
          k.status = $status
      RETURN k.nama AS nama,
             coalesce(k.description, '') AS description,
             coalesce(k.icon, 'map') AS icon,
             coalesce(k.status, 'active') AS status
    `, {
      name,
      description: req.body.description || '',
      icon: req.body.icon || 'map',
      status: req.body.status || 'active'
    });

    res.status(201).json({ success: true, message: 'Kategori KG berhasil ditambahkan', data: mapCategory(rows[0]) });
  } catch (error) { next(error); }
}

async function updateCategory(req, res, next) {
  try {
    const oldName = req.params.id;
    const newName = String(req.body.name || req.body.nama || oldName || '').trim();
    if (!newName) return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });

    const rows = await runNeo4j(`
      MATCH (k:Kategori {nama: $oldName})
      SET k.nama = $newName,
          k.description = $description,
          k.icon = $icon,
          k.status = $status
      RETURN k.nama AS nama,
             coalesce(k.description, '') AS description,
             coalesce(k.icon, 'map') AS icon,
             coalesce(k.status, 'active') AS status
    `, {
      oldName,
      newName,
      description: req.body.description || '',
      icon: req.body.icon || 'map',
      status: req.body.status || 'active'
    });

    if (!rows.length) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    res.json({ success: true, message: 'Kategori KG berhasil diperbarui', data: mapCategory(rows[0]) });
  } catch (error) { next(error); }
}

async function deleteCategory(req, res, next) {
  try {
    const name = req.params.id;
    const used = await runNeo4j(`
      MATCH (:Destinasi)-[:BERKATEGORI]->(k:Kategori {nama: $name})
      RETURN count(*) AS total
    `, { name });

    if ((used[0]?.total || 0) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Kategori masih dipakai oleh destinasi. Ubah kategori destinasi terlebih dahulu.'
      });
    }

    await runNeo4j(`MATCH (k:Kategori {nama: $name}) DETACH DELETE k`, { name });
    res.json({ success: true, message: 'Kategori KG berhasil dihapus' });
  } catch (error) { next(error); }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
