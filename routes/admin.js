const express = require('express');
const supabase = require('../utils/supabase');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// Admin: List all users
router.get('/users', auth, admin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, wallet_address, role, created_at, updated_at');
    if (error) return res.status(400).json({ error: error.message });
    res.json({ users: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Admin: List all projects
router.get('/projects', auth, admin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*');
    if (error) return res.status(400).json({ error: error.message });
    res.json({ projects: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

// Admin: Approve/reject project
router.post('/projects/:id/status', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected', 'archived', 'active'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const { data, error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', id)
      .select('*');
    if (error) return res.status(400).json({ error: error.message });
    res.json({ project: data && data[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project status.' });
  }
});

// Admin: List all payments
router.get('/payments', auth, admin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, users(wallet_address)')
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ payments: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments.' });
  }
});

// Admin: List all logs
router.get('/logs', auth, admin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ logs: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs.' });
  }
});

// Admin: List all analytics
router.get('/analytics', auth, admin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ analytics: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

// Admin: Update settings
router.put('/settings/:key', auth, admin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const { data, error } = await supabase
      .from('settings')
      .upsert({ key, value })
      .select('*');
    if (error) return res.status(400).json({ error: error.message });
    res.json({ setting: data && data[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update setting.' });
  }
});

module.exports = router;
