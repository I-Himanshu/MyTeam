import config from './config/index.js';
import createApp from './app.js';

const app = createApp();

// `config` is imported first: a missing/invalid environment variable throws
// here, before the process ever opens a port.
const server = app.listen(config.port, () => {
  console.log(`MyTeam API listening on http://localhost:${config.port}/api`);
});

/** Close the server so tests and container runtimes can shut down cleanly. */
function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
