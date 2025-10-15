// Small wrapper to re-export the serverless handler from dnd-server for Vercel
// Vercel expects functions under the /api directory or rewrites to an /api file.

const app = require('../dnd-server/server.js');

// If the server file exported a serverless handler (serverless-http) it will be a function,
// otherwise it's an express app. Vercel can accept either, but we'll normalize.

if (typeof app === 'function') {
  module.exports = app;
} else {
  // If it's an express app instance, wrap with serverless-http
  try {
    const serverless = require('serverless-http');
    module.exports = serverless(app);
  } catch (e) {
    // Last resort: attempt to export the app directly
    module.exports = app;
  }
}
