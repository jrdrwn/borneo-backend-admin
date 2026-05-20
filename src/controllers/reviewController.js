const pool = require('../config/db');

async function listReviews(req, res, next) {
  try {
    const admin = req.query.admin === 'true';
    const [rows] = await pool.query(
      `SELECT r.*, d.title destination_title
       FROM reviews r
       LEFT JOIN destinations d ON d.id=r.destination_id
       ${admin ? '' : "WHERE r.status='approved'"}
       ORDER BY r.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
}

async function createReview(req, res, next) {
  try {
    const { destination_id, name, rating, review_text } = req.body;
    if (!destination_id || !name || !rating) return res.status(400).json({ success: false, message: 'Data ulasan belum lengkap' });
    const [result] = await pool.query(
      'INSERT INTO reviews (destination_id, name, rating, review_text, status) VALUES (?, ?, ?, ?, ?)',
      [destination_id, name, rating, review_text || '', 'pending']
    );
    res.status(201).json({ success: true, message: 'Ulasan dikirim dan menunggu persetujuan admin', data: { id: result.insertId } });
  } catch (error) { next(error); }
}

async function updateReviewStatus(req, res, next) {
  try {
    await pool.query('UPDATE reviews SET status=? WHERE id=?', [req.body.status || 'pending', req.params.id]);
    res.json({ success: true, message: 'Status ulasan berhasil diperbarui' });
  } catch (error) { next(error); }
}

async function deleteReview(req, res, next) {
  try {
    await pool.query('DELETE FROM reviews WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Ulasan berhasil dihapus' });
  } catch (error) { next(error); }
}

module.exports = { listReviews, createReview, updateReviewStatus, deleteReview };
