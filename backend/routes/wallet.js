const express = require('express');
const supabase = require('../utils/supabase');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * GET /wallet/me — Get wallet info
 * POST /wallet/snapshot — [Front end calls after fetch wallet balance]
 */

router.get('/me', auth, async (req, res) => {
  const { user_id } = req.user;
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user_id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

// Store new balance snapshot, provider, network
router.post('/snapshot', auth, async (req, res) => {
  const { user_id, wallet_address } = req.user;
  const { provider, network, balance } = req.body;

  const { data, error } = await supabase
    .from('wallets')
    .upsert({
      user_id,
      wallet_address,
      provider,
      network,
      balance_snapshot: balance,
      is_admin: wallet_address === process.env.ADMIN_WALLET
    })
    .select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data && data[0]);
});

module.exports = router;