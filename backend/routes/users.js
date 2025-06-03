const express = require('express');
const supabase = require('../utils/supabase');
const auth = require('../middleware/auth');

const router = express.Router();

// Get profile of logged-in user (+ public profile info)
router.get('/me', auth, async (req, res) => {
  const user_id = req.user.user_id;
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user_id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(profile);
});

// Update profile
router.put('/me', auth, async (req, res) => {
  const user_id = req.user.user_id;
  const allowedFields = ['avatar', 'bio', 'skills', 'languages', 'country'];
  const update = {};
  for (const f of allowedFields) if (req.body[f] !== undefined) update[f] = req.body[f];
  if (Object.keys(update).length === 0)
    return res.status(400).json({ error: 'No updatable fields provided' });

  const { data, error } = await supabase
    .from('user_profiles')
    .update(update)
    .eq('user_id', user_id)
    .select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data && data[0]);
});

// Set/update KYC status (user uploads; admin approves)
router.put('/me/kyc', auth, async (req, res) => {
  // User may only set status to 'pending'
  const user_id = req.user.user_id;
  const { kyc_status } = req.body;
  if (kyc_status !== 'pending')
    return res.status(400).json({ error: 'Only pending allowed via this endpoint' });

  const { data, error } = await supabase
    .from('user_profiles')
    .update({ kyc_status })
    .eq('user_id', user_id)
    .select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data && data[0]);
});

// List all users (admin only)
const admin = require('../middleware/admin');
router.get('/', auth, admin, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, wallet_address, role, created_at, updated_at');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Get public profile by wallet address
router.get('/public/:address', async (req, res) => {
  const { address } = req.params;
  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('wallet_address', address)
    .single();
  if (error) return res.status(404).json({ error: 'User not found' });

  const { data: profile, error: err2 } = await supabase
    .from('user_profiles')
    .select('avatar,bio,skills,kyc_status,verification_level,languages,country')
    .eq('user_id', user.id)
    .single();
  if (err2) return res.status(404).json({ error: err2.message });
  res.json(profile);
});

module.exports = router;