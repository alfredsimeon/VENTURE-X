const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const supabase = require('./supabase');

module.exports = function(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', function connection(ws, req) {
    ws.on('message', async function incoming(raw) {
      let data;
      try { data = JSON.parse(raw); } catch { ws.close(); return; }
      if (data.type === 'auth') {
        try {
          // Verify JWT (from /auth/me endpoint)
          const payload = jwt.verify(data.token, process.env.JWT_SECRET);
          ws.user = payload;
          ws.send(JSON.stringify({ type: 'auth', status: 'ok' }));
        } catch (e) {
          ws.send(JSON.stringify({ type: 'auth', status: 'fail' }));
          ws.close();
        }
      }
      // Real-time chat relay
      if (data.type === 'chat') {
        // Example: Save message, relay (for now, only echo)
        ws.send(JSON.stringify({ type: 'chat', msg: data.msg }));
      }
    });
  });

  return wss;
};