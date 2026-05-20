const pool = require('../config/db');
const { fileUrl } = require('../utils/fileUrl');

async function listSettings(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM website_settings ORDER BY setting_key ASC');
    const data = {};
    rows.forEach(row => {
      data[row.setting_key] = row.setting_value;
      if (String(row.setting_key).includes('image')) data[`${row.setting_key}_url`] = fileUrl(req, row.setting_value);
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
}

async function upsertSettings(req, res, next) {
  try {
    const entries = Object.entries(req.body || {});
    for (const [key, value] of entries) {
      await pool.query(
        `INSERT INTO website_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)`,
        [key, value]
      );
    }
    if (req.file) {
      await pool.query(
        `INSERT INTO website_settings (setting_key, setting_value) VALUES ('hero_image', ?)
         ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)`,
        [`uploads/settings/${req.file.filename}`]
      );
    }
    res.json({ success: true, message: 'Pengaturan website berhasil diperbarui' });
  } catch (error) { next(error); }
}

module.exports = { listSettings, upsertSettings };
