import http from 'http';
import app from './app';
import { env } from './config/env';
import { initSocket } from './config/socket';

// Initialize workers
import './workers/import.worker';
import './workers/employee.worker';

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

const PORT = env.PORT;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
