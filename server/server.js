/*
 * ArthFlow no longer uses a standalone Node server. The Express app is served
 * by the Cloudflare Worker with a D1 binding.
 *
 * Use `npm run cf:dev` for local development or `npm run deploy` for production.
 */
console.error(
  'ArthFlow now runs on Cloudflare D1. Use `npm run cf:dev` (local) or `npm run deploy`.'
);
process.exit(1);
