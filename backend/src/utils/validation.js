// Shared validation helpers and allowed values.
// These lists must match the ENUMs in db/schema.sql.
const ROLES = ['student', 'faculty', 'technician', 'admin'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

// Error that carries an HTTP status code to the error handler.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Throws 400 if any of the listed fields is missing or blank.
function requireFields(body, fields) {
  const missing = fields.filter(
    (f) => body[f] === undefined || body[f] === null || String(body[f]).trim() === ''
  );
  if (missing.length) {
    throw new HttpError(400, `Missing required field(s): ${missing.join(', ')}`);
  }
}

// Throws 400 if value is present but not one of the allowed options.
function checkEnum(value, allowed, fieldName) {
  if (value !== undefined && !allowed.includes(value)) {
    throw new HttpError(400, `Invalid ${fieldName}. Allowed values: ${allowed.join(', ')}`);
  }
}

// Parses a route/body id and throws 400 if it is not a positive integer.
function parseId(value, fieldName = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer`);
  }
  return id;
}

module.exports = { ROLES, PRIORITIES, STATUSES, HttpError, requireFields, checkEnum, parseId };
