import app from './app.js';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initVoiceSocketServer } from './services/liveProxy.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = createServer(app);
initVoiceSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
