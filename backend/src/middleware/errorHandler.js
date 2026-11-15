// Catches errors thrown in any route and turns them into JSON responses.
// Express 5 automatically forwards errors from async route handlers here.

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Errors we threw on purpose (validation, not found, etc.)
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // Invalid JSON in the request body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }

  // Common MySQL errors -> friendly messages
  switch (err.code) {
    case 'ER_DUP_ENTRY':
      return res.status(409).json({ error: 'A record with that value already exists' });
    case 'ER_NO_REFERENCED_ROW_2':
      return res.status(400).json({ error: 'A referenced record (user, category or ticket) does not exist' });
    case 'ER_ROW_IS_REFERENCED_2':
      return res.status(409).json({ error: 'This record is still in use by other records and cannot be deleted' });
    default:
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { notFound, errorHandler };
