module.exports = (req, res) => {
  res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: `Không có API ${req.method} ${req.originalUrl}` } });
};
