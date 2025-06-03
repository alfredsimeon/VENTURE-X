require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

const websocketServer = require('./utils/websocket');
const app = express();

app.use(cors());
app.use(express.json());

// Modular routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/wallet', require('./routes/wallet'));
app.use('/projects', require('./routes/projects'));
app.use('/messages', require('./routes/messages'));
app.use('/files', require('./routes/files'));
app.use('/contracts', require('./routes/contracts'));
app.use('/payments', require('./routes/payments'));
app.use('/admin', require('./routes/admin'));
app.use('/notifications', require('./routes/notifications'));

// Health Check
app.get('/', (req, res) => res.send('VentureX API Alive'));

const server = http.createServer(app);
websocketServer(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`VentureX API listening on port ${PORT}`));