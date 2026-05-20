const { runNeo4j } = require('../config/neo4j');
const slugify = require('../utils/slugify');

function mapRegion(row) {
  const name = row.nama || '';
  return {
    id: name,
    nama: name,
    name,
    slug: slugify(name),
    provinsi: row.provinsi || 'Kalimantan Tengah',
    status: row.status || 'active'
  };
}

async function listRegions(req, res, next) {
  try {
    const rows = await runNeo4j(`
      MATCH (w:Wilayah)
      RETURN w.nama AS nama,
             coalesce(w.provinsi, 'Kalimantan Tengah') AS provinsi,
             coalesce(w.status, 'active') AS status
      ORDER BY w.nama ASC
    `);
    res.json({ success: true, data: rows.map(mapRegion) });
  } catch (error) { next(error); }
}

async function createRegion(req, res, next) {
  try {
    const nama = String(req.body.nama || req.body.name || '').trim();
    if (!nama) return res.status(400).json({ success: false, message: 'Nama wilayah wajib diisi' });

    const rows = await runNeo4j(`
      MERGE (w:Wilayah {nama: $nama})
      SET w.provinsi = $provinsi,
          w.status = $status
      RETURN w.nama AS nama,
             coalesce(w.provinsi, 'Kalimantan Tengah') AS provinsi,
             coalesce(w.status, 'active') AS status
    `, {
      nama,
      provinsi: req.body.provinsi || 'Kalimantan Tengah',
      status: req.body.status || 'active'
    });

    res.status(201).json({ success: true, message: 'Wilayah KG berhasil ditambahkan', data: mapRegion(rows[0]) });
  } catch (error) { next(error); }
}

async function updateRegion(req, res, next) {
  try {
    const oldName = req.params.id;
    const newName = String(req.body.nama || req.body.name || oldName || '').trim();
    if (!newName) return res.status(400).json({ success: false, message: 'Nama wilayah wajib diisi' });

    const rows = await runNeo4j(`
      MATCH (w:Wilayah {nama: $oldName})
      SET w.nama = $newName,
          w.provinsi = $provinsi,
          w.status = $status
      RETURN w.nama AS nama,
             coalesce(w.provinsi, 'Kalimantan Tengah') AS provinsi,
             coalesce(w.status, 'active') AS status
    `, {
      oldName,
      newName,
      provinsi: req.body.provinsi || 'Kalimantan Tengah',
      status: req.body.status || 'active'
    });

    if (!rows.length) return res.status(404).json({ success: false, message: 'Wilayah tidak ditemukan' });
    res.json({ success: true, message: 'Wilayah KG berhasil diperbarui', data: mapRegion(rows[0]) });
  } catch (error) { next(error); }
}

async function deleteRegion(req, res, next) {
  try {
    const nama = req.params.id;
    const used = await runNeo4j(`
      MATCH (:Destinasi)-[:BERLOKASI_DI]->(w:Wilayah {nama: $nama})
      RETURN count(*) AS total
    `, { nama });

    if ((used[0]?.total || 0) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Wilayah masih dipakai oleh destinasi. Ubah wilayah destinasi terlebih dahulu.'
      });
    }

    await runNeo4j(`MATCH (w:Wilayah {nama: $nama}) DETACH DELETE w`, { nama });
    res.json({ success: true, message: 'Wilayah KG berhasil dihapus' });
  } catch (error) { next(error); }
}

module.exports = { listRegions, createRegion, updateRegion, deleteRegion };
