const express = require('express');
const supabase = require('../utils/supabase');
const auth = require('../middleware/auth');

const router = express.Router();

// Get notifications for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user_id)
      .order('timestamp', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ notifications: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// Mark notification as read
router.post('/read/:id', auth, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user_id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

module.exports = router;
