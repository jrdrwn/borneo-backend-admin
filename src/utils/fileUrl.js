function fileUrl(req, filePath) {
  if (!filePath) return null;
  if (String(filePath).startsWith('http')) return filePath;
  const base = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
  const cleaned = String(filePath).replace(/^\/+/, '');
  return `${base}/${cleaned}`;
}

function mapImageUrls(req, row) {
  if (!row) return row;
  const copy = { ...row };
  if (copy.main_image) copy.main_image_url = fileUrl(req, copy.main_image);
  if (copy.image) copy.image_url = fileUrl(req, copy.image);
  return copy;
}

module.exports = { fileUrl, mapImageUrls };
