const express = require('express');
const supabase = require('../utils/supabase');
const auth = require('../middleware/auth');
const adminWallet = process.env.ADMIN_WALLET;
const { sendNotification } = require('../utils/notifications');
const { verifySolanaSignature } = require('../utils/crypto');

const router = express.Router();

// Record a payment (after on-chain verification)
router.post('/record', auth, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { type, amount, method, tx_hash } = req.body;
    // Validate input
    if (!['subscription', 'contract_fee'].includes(type) ||
        !['solana', 'USDC'].includes(method) ||
        !amount || isNaN(amount) || Number(amount) <= 0 ||
        !tx_hash) {
      return res.status(400).json({ error: 'Invalid payment data.' });
    }
    // TODO: Replace with actual on-chain Solana tx verification
    // For now, just check tx_hash is a string of reasonable length
    if (typeof tx_hash !== 'string' || tx_hash.length < 32) {
      return res.status(400).json({ error: 'Invalid transaction hash.' });
    }
    // Insert payment record
    const { data, error } = await supabase
      .from('payments')
      .insert([{ user_id, type, amount, method, tx_hash }])
      .select('*');
    if (error) return res.status(400).json({ error: error.message });
    // Optionally update subscription status
    if (type === 'subscription') {
      await supabase
        .from('subscriptions')
        .update({ status: 'active', start_date: new Date().toISOString() })
        .eq('user_id', user_id);
    }
    // Send notification
    await sendNotification(user_id, `Payment of ${amount} ${method} recorded.`, 'payment');
    res.status(201).json({ success: true, payment: data[0] });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get my payments
router.get('/my', auth, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ payments: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments.' });
  }
});

// Admin: Get all payments
const admin = require('../middleware/admin');
router.get('/all', auth, admin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, users(wallet_address)')
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ payments: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch all payments.' });
  }
});

module.exports = router;
