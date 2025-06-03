const express = require('express');
const supabase = require('../utils/supabase');
const auth = require('../middleware/auth');
const aiVerify = require('../utils/ai_verify');

const router = express.Router();

// Upload file metadata (after upload to web3.storage)
router.post('/', auth, async (req, res) => {
  const { user_id } = req.user;
  const { project_id, file_url, type } = req.body;

  const { data, error } = await supabase
    .from('files')
    .insert({
      user_id, project_id, file_url, type,
      status: 'pending',
      uploaded_at: new Date().toISOString()
    }).select('*');
  if (error) return res.status(400).json({ error: error.message });

  // Kick off AI verification in background:
  aiVerify(file_url).then(async verification => {
    await supabase.from('file_verifications').insert({
      file_id: data[0].id, ...verification
    });
    // Update file status as necessary
    await supabase.from('files')
      .update({ status: verification.tampered_detected ? 'tampered' : 'verified' })
      .eq('id', data[0].id);
  });

  res.json(data[0]);
});

// List my files
router.get('/me', auth, async (req, res) => {
  const { user_id } = req.user;
  const { data, error } = await supabase.from('files').select('*').eq('user_id', user_id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Get verification report
router.get('/verification/:file_id', auth, async (req, res) => {
  const { file_id } = req.params;
  const { data, error } = await supabase.from('file_verifications').select('*').eq('file_id', file_id).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

module.exports = router;