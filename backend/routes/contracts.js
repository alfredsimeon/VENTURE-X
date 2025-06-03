const express = require('express');
const supabase = require('../utils/supabase');
const auth = require('../middleware/auth');

// TODO: Auto-AI draft: see /utils/ai_verify.js for template usage

const router = express.Router();

// Create draft contract
router.post('/draft', auth, async (req, res) => {
  const { project_id, investor_id, template_id, variables } = req.body;
  const entrepreneur_id = req.user.user_id;

  // Optionally fetch template and use AI here to fill it
  const { data: template } = await supabase.from('contract_templates').select('*').eq('id', template_id).single();
  const content = template ? template.content : "";
  // TODO: use OpenAI (not included for security)
  // For now: just store variables as JSON
  const { data, error } = await supabase.from('contracts').insert({
    project_id, entrepreneur_id, investor_id, status: 'draft', ai_generated: false
  }).select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

// Sign contract (investor or entrepreneur)
router.post('/sign/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { signature } = req.body;
  const { user_id } = req.user;

  const { data: contract, error } = await supabase.from('contracts').select('*').eq('id', id).single();
  if (error || !contract) return res.status(404).json({ error: 'Not found' });

  let updates = {};
  if (user_id === contract.entrepreneur_id) updates.entrepreneur_signature = signature;
  else if (user_id === contract.investor_id) updates.investor_signature = signature;
  else return res.status(403).json({ error: 'Not allowed' });

  // If both signatures present, mark as signed and locked
  const signed_by_both = Boolean(
    updates.entrepreneur_signature || contract.entrepreneur_signature
  ) && Boolean(
    updates.investor_signature || contract.investor_signature
  );

  if (signed_by_both) {
    updates.signed_by_both = true;
    updates.status = 'signed';
    updates.locked = true;
    // Register platform fee payment here
    // TODO: Insert payment record (2% platform fee)
  }

  const { data: updated, error: updErr } = await supabase
    .from('contracts')
    .update(updates)
    .eq('id', id)
    .select('*');
  if (updErr) return res.status(400).json({ error: updErr.message });
  res.json(updated[0]);
});

// Get a contract (only involved users)
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.user;
  const { data: contract, error } = await supabase.from('contracts').select('*').eq('id', id).single();
  if (error || !contract) return res.status(404).json({ error: 'Not found' });
  if (user_id !== contract.entrepreneur_id && user_id !== contract.investor_id)
    return res.status(403).json({ error: 'Not allowed' });
  res.json(contract);
});

module.exports = router;