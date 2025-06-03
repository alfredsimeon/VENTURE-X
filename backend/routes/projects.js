const express = require('express');
const supabase = require('../utils/supabase');
const auth = require('../middleware/auth');

const router = express.Router();

// Submit new project/startup/org
router.post('/', auth, async (req, res) => {
  const { title, description, budget, type } = req.body;
  const { user_id } = req.user;

  const { data: proj, error } = await supabase.from('projects').insert({
    title, description, budget, type,
    status: 'pending',
    owner_id: user_id,
    created_at: new Date().toISOString(),
  }).select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(proj[0]);
});

// Get all active/approved projects (with filtering)
router.get('/', async (req, res) => {
  let query = supabase.from('projects').select('*').eq('status', 'approved');
  // Filtering examples (industry, budget, etc)
  if (req.query.type) query = query.eq('type', req.query.type);
  if (req.query.min_budget) query = query.gte('budget', Number(req.query.min_budget));
  if (req.query.max_budget) query = query.lte('budget', Number(req.query.max_budget));
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Get my own projects
router.get('/me', auth, async (req, res) => {
  const { user_id } = req.user;
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user_id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Get single project (for public & phase logic)
router.get('/:project_id', async (req, res) => {
  const { project_id } = req.params;
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', project_id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

module.exports = router;