/*
 * Cloudflare Worker entry point.
 *
 * Static assets are served by the Worker itself. All /api requests are forwarded
 * to a single Durable Object which owns the Express app and the MongoDB connection.
 * This follows Cloudflare's recommended Mongoose-on-Workers pattern: create the
 * client in the Durable Object and keep all database work inside it.
 */
import { DurableObject } from 'cloudflare:workers';
import { handleAsNodeRequest } from 'cloudflare:node';
import mongoose from 'mongoose';
import createApp from './app.js';

const PORT = 3000;

export class ArthFlowAPI extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);

    // Backend modules read these with process.env; copy bindings across once.
    process.env.MONGO_URI = env.MONGO_URI;
    process.env.JWT_SECRET = env.JWT_SECRET;
    process.env.JWT_EXPIRES_IN = env.JWT_EXPIRES_IN || '30d';
    process.env.CLIENT_URL = env.CLIENT_URL || '';

    const app = createApp();
    app.listen(PORT);
  }

  async fetch(request) {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(this.env.MONGO_URI, {
        maxPoolSize: 1,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 5000,
        maxIdleTimeMS: 20_000,
      });
    } else if (mongoose.connection.readyState === 2) {
      await mongoose.connection.asPromise();
    }

    return handleAsNodeRequest(PORT, request);
  }
}

export default {
  fetch(request, env) {
    const id = env.ARTHFLOW_API.idFromName('arthflow');
    return env.ARTHFLOW_API.get(id).fetch(request);
  },
};
