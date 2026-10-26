const crypto = require('node:crypto');

function createClaimToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createBoxCode() {
  // The unique database constraint is the final collision guard.
  return `SP-${crypto.randomInt(0, 100000).toString().padStart(5, '0')}`;
}

module.exports = { createClaimToken, hashToken, createBoxCode };
