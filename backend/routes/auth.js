const express = require('express');
const supabase = require('../utils/supabase');
const jwt = require('jsonwebtoken');
const { verifySolanaSignature } = require('../utils/crypto');

const router = express.Router();

/**
 * Step 1: Client calls `/auth/nonce` with their wallet address, get a nonce
 * Step 2: Client signs nonce. Calls `/auth/verify` with address, signature
 * Step 3: Receive JWT if valid (use for all other API calls)
 */

// Get nonce (prevent replay attacks)
router.post('/nonce', async (req, res) => {
  const { wallet_address } = req.body;
  const nonce = `VentureX-${Math.floor(Math.random() * 1e8)}-${Date.now()}`;
  // Remove expired tokens
  await supabase.from('wallet_auth_tokens').delete().lt('expiry', new Date().toISOString());
  // Save nonce for this address
  await supabase.from('wallet_auth_tokens').upsert({
    wallet_address,
    nonce,
    expiry: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    last_used: new Date().toISOString(),
  });
  res.json({ nonce });
});

// Verify signed nonce, issue JWT
router.post('/verify', async (req, res) => {
  const { wallet_address, signature } = req.body;
  // Fetch nonce
  const { data: rows } = await supabase
    .from('wallet_auth_tokens')
    .select('*')
    .eq('wallet_address', wallet_address)
    .order('last_used', { ascending: false })
    .limit(1);
  if (!rows || !rows.length) return res.status(401).json({ error: 'Nonce expired' });
  const { nonce, expiry } = rows[0];
  // Verify signature
  const valid = verifySolanaSignature(wallet_address, nonce, signature);
  if (!valid) return res.status(401).json({ error: 'Signature invalid' });
  // Find or create user
  let { data: user } = await supabase.from('users').select('*').eq('wallet_address', wallet_address).single();
  if (!user) {
    // Register new user as 'investor' (default)
    let { data: newUser } = await supabase.from('users').insert({
      wallet_address, role: (process.env.ADMIN_WALLET === wallet_address ? 'admin' : 'investor')
    }).select('*');
    user = newUser && newUser[0];
    await supabase.from('user_profiles').insert({ user_id: user.id });
  }
  // Create JWT
  const token = jwt.sign({
    user_id: user.id,
    role: user.role,
    wallet_address: user.wallet_address
  }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// Auth check
router.get('/me', require('../middleware/auth'), async (req, res) => {
  res.json({ ...req.user });
});

module.exports = router;