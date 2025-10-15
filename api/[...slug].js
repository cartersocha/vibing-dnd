// Catch-all API route for Vercel to forward /api/* requests to the main server handler.
// This file ensures Vercel invokes the node function rather than serving static files.

const handler = require('../dnd-server/server.js');

module.exports = handler;
