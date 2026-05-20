const pool = require('../config/db');
const { mapImageUrls, fileUrl } = require('../utils/fileUrl');

async function homeData(req, res, next) {
  try {
    const [categories] = await pool.query("SELECT * FROM categories WHERE status='active' ORDER BY id ASC");
    const [destinations] = await pool.query(
      `SELECT d.*, c.name category_name, c.slug category_slug
       FROM destinations d
       LEFT JOIN categories c ON c.id=d.category_id
       WHERE d.status='published'
       ORDER BY d.updated_at DESC LIMIT 6`
    );
    const [events] = await pool.query("SELECT * FROM events WHERE status='active' ORDER BY event_date ASC LIMIT 4");
    const [settingsRows] = await pool.query('SELECT * FROM website_settings');
    const settings = {};
    settingsRows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
      if (String(row.setting_key).includes('image')) settings[`${row.setting_key}_url`] = fileUrl(req, row.setting_value);
    });

    res.json({
      success: true,
      data: {
        categories,
        destinations: destinations.map(row => mapImageUrls(req, row)),
        events: events.map(row => mapImageUrls(req, row)),
        settings
      }
    });
  } catch (error) { next(error); }
}

module.exports = { homeData };
