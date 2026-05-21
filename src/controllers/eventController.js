const pool = require('../config/db');
const slugify = require('../utils/slugify');
const { mapImageUrls } = require('../utils/fileUrl');

function eventImage(file) {
  return file ? file.url || file.path || file.location || null : null;
}

async function listEvents(req, res, next) {
  try {
    const admin = req.query.admin === 'true';
    const [rows] = await pool.query(`SELECT * FROM events ${admin ? '' : "WHERE status='active'"} ORDER BY event_date ASC`);
    res.json({ success: true, data: rows.map(row => mapImageUrls(req, row)) });
  } catch (error) { next(error); }
}

async function createEvent(req, res, next) {
  try {
    const { title, event_date, location, description, status } = req.body;
    if (!title || !event_date) return res.status(400).json({ success: false, message: 'Judul dan tanggal event wajib diisi' });
    const image = eventImage(req.file);
    const slug = slugify(req.body.slug || title);
    const [result] = await pool.query(
      'INSERT INTO events (title, slug, event_date, location, description, image, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, slug, event_date, location || '', description || '', image, status || 'active']
    );
    const [rows] = await pool.query('SELECT * FROM events WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Event berhasil ditambahkan', data: mapImageUrls(req, rows[0]) });
  } catch (error) { next(error); }
}

async function updateEvent(req, res, next) {
  try {
    const [oldRows] = await pool.query('SELECT * FROM events WHERE id=?', [req.params.id]);
    if (!oldRows.length) return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
    const old = oldRows[0];
    const { title, event_date, location, description, status } = req.body;
    const image = eventImage(req.file) || old.image;
    const slug = slugify(req.body.slug || title || old.title);
    await pool.query(
      'UPDATE events SET title=?, slug=?, event_date=?, location=?, description=?, image=?, status=? WHERE id=?',
      [title || old.title, slug, event_date || old.event_date, location || '', description || '', image, status || old.status, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM events WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Event berhasil diperbarui', data: mapImageUrls(req, rows[0]) });
  } catch (error) { next(error); }
}

async function deleteEvent(req, res, next) {
  try {
    await pool.query('DELETE FROM events WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Event berhasil dihapus' });
  } catch (error) { next(error); }
}

module.exports = { listEvents, createEvent, updateEvent, deleteEvent };
