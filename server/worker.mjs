/*
 * Cloudflare Worker entry point.
 *
 * Static assets are served by the Worker's asset binding. All /api requests are
 * handled by the same Express app, with the D1 database binding (env.DB)
 * injected into app.locals for every request.
 *
 * Unlike MongoDB, D1 needs no long-lived socket, so no Durable Object is needed.
 */
import { handleAsNodeRequest } from 'cloudflare:node';
import createApp from './app.js';

const PORT = 3000;
const app = createApp();
app.listen(PORT);

export default {
  fetch(request, env) {
    app.locals.db = env.DB;
    process.env.JWT_SECRET = env.JWT_SECRET;
    process.env.JWT_EXPIRES_IN = env.JWT_EXPIRES_IN || '30d';
    process.env.CLIENT_URL = env.CLIENT_URL || 'http://localhost:5000';
    return handleAsNodeRequest(PORT, request);
  },
};
