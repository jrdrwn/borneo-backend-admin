require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

async function seed() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  await pool.query(`INSERT IGNORE INTO admin_roles (id, role_name, description) VALUES
    (1, 'Super Admin', 'Memiliki akses penuh ke seluruh fitur admin'),
    (2, 'Admin', 'Mengelola data destinasi, booking, event, dan pesan')`);

  await pool.query(
    `INSERT INTO admin_users (role_id, name, email, password_hash, phone, status)
     VALUES (1, 'Admin BorneoTrip', 'admin@borneotrip.com', ?, '081200000000', 'active')
     ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), status='active'`,
    [passwordHash]
  );

  console.log('Admin berhasil dibuat/diperbarui');
  console.log('Email: admin@borneotrip.com');
  console.log('Password: admin123');
  await pool.end();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
