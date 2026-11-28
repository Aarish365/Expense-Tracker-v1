/*
 * Cloudflare Worker entry point.
 * Serves the same Express API as server.js, but reads secrets from Worker bindings.
 * Cloudflare's nodejs_compat lets Express run on Workers; Mongoose 9 supports Workers too.
 *
 * Workers do not allow async I/O at module scope, so MongoDB is connected lazily
 * on the first API request and the connection promise is reused afterwards.
 */
import { env } from 'cloudflare:workers';
import { handleAsNodeRequest } from 'cloudflare:node';
import createApp from './app.js';
import connectDB from './config/db.js';

// The rest of the backend reads these with process.env, so copy bindings across.
process.env.MONGO_URI = env.MONGO_URI;
process.env.JWT_SECRET = env.JWT_SECRET;
process.env.JWT_EXPIRES_IN = env.JWT_EXPIRES_IN || '30d';
process.env.CLIENT_URL = env.CLIENT_URL || '';

const PORT = 3000;
const app = createApp();
app.listen(PORT);

let dbReady = null;
const ensureDB = () => {
  if (!dbReady) {
    dbReady = connectDB(env.MONGO_URI, { exitOnError: false }).catch((error) => {
      dbReady = null; // allow a retry on the next request
      throw error;
    });
  }
  return dbReady;
};

export default {
  async fetch(request) {
    // Health check stays available even if the database is unreachable.
    const pathname = new URL(request.url).pathname;
    if (pathname !== '/api/health') {
      try {
        await ensureDB();
      } catch (error) {
        return new Response(JSON.stringify({ message: 'Database unavailable', error: error.message }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        });
      }
    }

    return handleAsNodeRequest(PORT, request);
  },
};
