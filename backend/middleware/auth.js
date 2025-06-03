const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  let token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  if (token.startsWith('Bearer ')) token = token.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};