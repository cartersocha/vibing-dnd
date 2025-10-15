// Diagnostic endpoint deployed alongside the dnd-client project
// This ensures the function lives under the same project root Vercel is serving.
module.exports = (req, res) => {
  const { method, url, headers } = req;
  const debugHeaders = {
    host: headers.host,
    origin: headers.origin,
    referer: headers.referer || headers.referrer,
    'x-vercel-id': headers['x-vercel-id'],
    'x-vercel-cache': headers['x-vercel-cache'],
    'content-type': headers['content-type']
  };

  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify({ ok: true, method, url, headers: debugHeaders }));
};
