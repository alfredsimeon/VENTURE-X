const supabase = require('./supabase');

/**
 * Send a notification to a user
 * @param {string} user_id
 * @param {string} message
 * @param {string} type
 */
async function sendNotification(user_id, message, type = 'info') {
  if (!user_id || !message) return;
  await supabase.from('notifications').insert([{ user_id, message, type }]);
}

module.exports = { sendNotification };
