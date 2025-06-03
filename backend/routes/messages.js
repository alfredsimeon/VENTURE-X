const express = require('express');
const supabase = require('../utils/supabase');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all chat sessions for user
router.get('/chats', auth, async (req, res) => {
  const { user_id } = req.user;
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .contains('participants', [user_id]);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Get all messages in a session
router.get('/:chat_id', auth, async (req, res) => {
  const { chat_id } = req.params;
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chat_id)
    .order('timestamp', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Start or get chat session (returns chat_id)
router.post('/start', auth, async (req, res) => {
  const { user_id } = req.user;
  const { other_id } = req.body;
  // Check for existing session
  const { data: sessions } = await supabase
    .from('chat_sessions')
    .select('*')
    .contains('participants', [user_id, other_id]);
  if (sessions && sessions.length > 0) return res.json({ chat_id: sessions[0].id });
  // Create new
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ participants: [user_id, other_id], is_active: true, last_message_at: new Date().toISOString() })
    .select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json({ chat_id: data[0].id });
});

// Send a message
router.post('/:chat_id', auth, async (req, res) => {
  const { chat_id } = req.params;
  const { user_id } = req.user;
  const { message, receiver_id, project_id } = req.body;
  // Only if participant
  const { data: session } = await supabase.from('chat_sessions').select('*').eq('id', chat_id).single();
  if (!session || !session.participants.includes(user_id))
    return res.status(403).json({ error: 'Not allowed' });

  const insertData = {
    chat_id, sender_id: user_id, receiver_id, project_id, message,
    timestamp: new Date().toISOString(), read_status: false
  };

  const { data, error } = await supabase.from('messages').insert(insertData).select('*');
  await supabase.from('chat_sessions').update({ last_message_at: insertData.timestamp }).eq('id', chat_id);
  if (error) return res.status(400).json({ error: error.message });

  // TODO: push via WebSocket here to receiver
  res.json(data[0]);
});

module.exports = router;