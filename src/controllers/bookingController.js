const pool = require('../config/db');

async function listBookings(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, d.title destination_title
       FROM bookings b
       LEFT JOIN destinations d ON d.id=b.destination_id
       ORDER BY b.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
}

async function createBooking(req, res, next) {
  try {
    const { destination_id, full_name, email, phone, visit_date, total_person, notes } = req.body;
    if (!destination_id || !full_name || !email || !phone || !visit_date || !total_person) {
      return res.status(400).json({ success: false, message: 'Data booking belum lengkap' });
    }
    const [result] = await pool.query(
      `INSERT INTO bookings (destination_id, full_name, email, phone, visit_date, total_person, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [destination_id, full_name, email, phone, visit_date, total_person, notes || '']
    );
    res.status(201).json({ success: true, message: 'Booking berhasil dikirim', data: { id: result.insertId } });
  } catch (error) { next(error); }
}

async function updateBookingStatus(req, res, next) {
  try {
    await pool.query('UPDATE bookings SET status=? WHERE id=?', [req.body.status || 'pending', req.params.id]);
    res.json({ success: true, message: 'Status booking berhasil diperbarui' });
  } catch (error) { next(error); }
}

async function deleteBooking(req, res, next) {
  try {
    await pool.query('DELETE FROM bookings WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Booking berhasil dihapus' });
  } catch (error) { next(error); }
}

module.exports = { listBookings, createBooking, updateBookingStatus, deleteBooking };
