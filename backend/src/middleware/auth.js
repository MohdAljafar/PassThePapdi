const { jwtVerify } = require('jose');

function secretKey() {
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.spc_session || req.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    if (!payload.sub) return res.status(401).json({ error: 'Invalid session.' });
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' });
  }
}

module.exports = { requireAuth, secretKey };
