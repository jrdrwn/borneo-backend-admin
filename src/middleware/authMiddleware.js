const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function protectAdmin(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token admin tidak ditemukan' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    const [rows] = await pool.query(
      `SELECT au.id, au.name, au.email, au.status, ar.role_name
       FROM admin_users au
       JOIN admin_roles ar ON ar.id = au.role_id
       WHERE au.id = ? LIMIT 1`,
      [decoded.id]
    );

    if (!rows.length || rows[0].status !== 'active') {
      return res.status(401).json({ success: false, message: 'Admin tidak valid atau tidak aktif' });
    }

    req.admin = rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token admin tidak valid' });
  }
}

module.exports = { protectAdmin };
