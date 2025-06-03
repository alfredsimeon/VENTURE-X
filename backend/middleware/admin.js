const supabase = require('../utils/supabase');

module.exports = async function (req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  // Also support static admin wallet as superadmin
  if (req.user && req.user.wallet_address === process.env.ADMIN_WALLET) return next();
  return res.status(403).json({ error: 'Admin only' });
};