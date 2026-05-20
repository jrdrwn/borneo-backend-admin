const pool = require('../config/db');
const { runNeo4j } = require('../config/neo4j');

async function getDashboard(req, res, next) {
  try {
    let destinations = 0;
    let categories = 0;
    let regions = 0;

    try {
      const kgCounts = await runNeo4j(`
        MATCH (d:Destinasi)
        WITH count(d) AS destinations
        MATCH (k:Kategori)
        WITH destinations, count(k) AS categories
        MATCH (w:Wilayah)
        RETURN destinations, categories, count(w) AS regions
      `);
      destinations = kgCounts[0]?.destinations || 0;
      categories = kgCounts[0]?.categories || 0;
      regions = kgCounts[0]?.regions || 0;
    } catch (err) {
      // Jika Neo4j belum aktif, dashboard tetap bisa dibuka.
    }

    let latestBookings = [];
    let bookings = { total: 0 };
    let reviews = { total: 0 };
    let messages = { total: 0 };

    try {
      [[bookings]] = await pool.query('SELECT COUNT(*) total FROM bookings');
      [[reviews]] = await pool.query("SELECT COUNT(*) total FROM reviews WHERE status='pending'");
      [[messages]] = await pool.query("SELECT COUNT(*) total FROM contact_messages WHERE status='unread'");
      [latestBookings] = await pool.query(
        `SELECT b.id, b.full_name, b.visit_date, b.total_person, b.status, d.title destination_title
         FROM bookings b
         LEFT JOIN destinations d ON d.id = b.destination_id
         ORDER BY b.created_at DESC LIMIT 5`
      );
    } catch (err) {
      latestBookings = [];
    }

    res.json({
      success: true,
      data: {
        counts: {
          destinations,
          publishedDestinations: destinations,
          categories,
          regions,
          bookings: bookings.total || 0,
          pendingReviews: reviews.total || 0,
          unreadMessages: messages.total || 0
        },
        latestBookings
      }
    });
  } catch (error) { next(error); }
}

module.exports = { getDashboard };
