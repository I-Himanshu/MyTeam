import express from 'express';
import cors from 'cors';

import config from './config/index.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import errorHandler from './middleware/errorHandler.js';

/**
 * Build the Express application.
 *
 * This is a pure app factory: it wires middleware and routes but never calls
 * `listen` — that is `src/server.js`'s job. Tests import this factory directly.
 *
 * @param {{clientUrl?: string}} [options] Override the CORS origin (tests).
 * @returns {import('express').Express}
 */
export default function createApp(options = {}) {
  const app = express();
  const clientUrl = options.clientUrl ?? config.clientUrl;

  // CORS is restricted to the frontend origin only (ARCHITECTURE §5).
  // A plain string would make `cors` echo the configured origin on every
  // response, so the origin is compared explicitly instead: disallowed origins
  // get no CORS headers at all. Requests without an Origin header (curl, tests)
  // are not a CORS concern and pass through.
  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, !origin || origin === clientUrl);
      },
    }),
  );

  // JSON body parsing. Syntax errors are forwarded to the error handler.
  app.use(express.json());

  // Single mount point for every API route.
  const apiRouter = express.Router();

  apiRouter.get('/health', (req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok' } });
  });

  app.use('/api', apiRouter);

  // Centralized handlers — order matters: 404 first, errors last.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
