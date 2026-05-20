const pool = require('../config/db');

async function listContacts(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
}

async function createContact(req, res, next) {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ success: false, message: 'Nama, email, dan pesan wajib diisi' });
    const [result] = await pool.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject || '', message]
    );
    res.status(201).json({ success: true, message: 'Pesan berhasil dikirim', data: { id: result.insertId } });
  } catch (error) { next(error); }
}

async function updateContactStatus(req, res, next) {
  try {
    await pool.query('UPDATE contact_messages SET status=? WHERE id=?', [req.body.status || 'read', req.params.id]);
    res.json({ success: true, message: 'Status pesan berhasil diperbarui' });
  } catch (error) { next(error); }
}

async function deleteContact(req, res, next) {
  try {
    await pool.query('DELETE FROM contact_messages WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Pesan berhasil dihapus' });
  } catch (error) { next(error); }
}

module.exports = { listContacts, createContact, updateContactStatus, deleteContact };
