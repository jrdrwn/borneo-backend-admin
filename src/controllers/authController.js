const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

function createToken(admin) {
  return jwt.sign({ id: admin.id, role: admin.role_name }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

async function loginAdmin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
    }

    const [rows] = await pool.query(
      `SELECT au.*, ar.role_name
       FROM admin_users au
       JOIN admin_roles ar ON ar.id = au.role_id
       WHERE au.email = ? LIMIT 1`,
      [email]
    );

    if (!rows.length) return res.status(401).json({ success: false, message: 'Email atau password salah' });

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password_hash || '');
    if (!match) return res.status(401).json({ success: false, message: 'Email atau password salah' });

    await pool.query('UPDATE admin_users SET last_login = NOW() WHERE id = ?', [admin.id]);

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        token: createToken(admin),
        admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role_name }
      }
    });
  } catch (error) { next(error); }
}

async function profile(req, res) {
  res.json({ success: true, data: req.admin });
}

module.exports = { loginAdmin, profile };
