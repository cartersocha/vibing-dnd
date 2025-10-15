// dnd-server/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sanitizeHtml = require('sanitize-html');
const multer = require('multer');
const path = require('path');
const { put, list, del } = require('@vercel/blob');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// ----- Core middleware
app.use(cors());
app.options('*', cors()); // ensure preflight never 405s
app.use(express.json({ limit: '5mb' }));

// ----- Multer (optional: only if you actually upload files from server)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ----- Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  // Prefer a service role on the server; fall back to anon if that's all you have.
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// ==============================
// Diagnostics
// ==============================
app.all('/api/_diag', (req, res) => {
  const { method, url, headers, body } = req;
  res.json({
    ok: true,
    method,
    url,
    headers: {
      host: headers.host,
      origin: headers.origin,
      referer: headers.referer,
      'content-type': headers['content-type'],
    },
    body
  });
});

// ==============================
// Sessions (a.k.a. notes)
// Table: notes  (id, title, date, content, image_url)
// ==============================

// List sessions
app.get('/api/notes', async (_req, res) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('id', { ascending: false });

  if (error) return res.status(500).json({ message: 'Fetch notes failed', error: error.message });
  res.json(data);
});

// Create session
// parse form-data fields (no files) if client sends FormData
app.post('/api/notes', upload.none(), async (req, res) => {
  try {
    const { title, date, content, image_url } = req.body;
    const clean = {
      title: sanitizeHtml(title || ''),
      date,
      content: sanitizeHtml(content || ''),
      image_url: image_url || null
    };

    const { data, error } = await supabase.from('notes').insert(clean).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ message: 'Create note failed', error: e.message });
  }
});

// Get one session
app.get('/api/notes/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ message: 'Note not found', error: error.message });
  res.json(data);
});

// Update session
app.put('/api/notes/:id', upload.none(), async (req, res) => {
  try {
    const { title, date, content, image_url } = req.body;
    const patch = {
      ...(title !== undefined ? { title: sanitizeHtml(title) } : {}),
      ...(date !== undefined ? { date } : {}),
      ...(content !== undefined ? { content: sanitizeHtml(content) } : {}),
      ...(image_url !== undefined ? { image_url } : {}),
    };

    const { data, error } = await supabase
      .from('notes')
      .update(patch)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: 'Update note failed', error: e.message });
  }
});

// Delete session
app.delete('/api/notes/:id', async (req, res) => {
  const { error } = await supabase.from('notes').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: 'Delete note failed', error: error.message });
  res.status(204).send();
});

// ==============================
// Characters
// Table: characters (id, name, race, class, status, location, backstory, image_url, player_type)
// ==============================

// List characters
app.get('/api/characters', async (_req, res) => {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('id', { ascending: false });

  if (error) return res.status(500).json({ message: 'Fetch characters failed', error: error.message });
  res.json(data);
});

// Create character
app.post('/api/characters', upload.none(), async (req, res) => {
  try {
    const { name, race, class: klass, status, location, backstory, image_url, player_type } = req.body;

    const clean = {
      name: sanitizeHtml(name || ''),
      race: sanitizeHtml(race || ''),
      class: sanitizeHtml(klass || ''),
      status: status ? sanitizeHtml(status) : null,
      location: location ? sanitizeHtml(location) : null,
      backstory: backstory ? sanitizeHtml(backstory) : null,
      image_url: image_url || null,
      player_type: sanitizeHtml(player_type || 'npc')
    };

    const { data, error } = await supabase.from('characters').insert(clean).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ message: 'Create character failed', error: e.message });
  }
});

// Update character
app.put('/api/characters/:id', upload.none(), async (req, res) => {
  try {
    const { name, race, class: klass, status, location, backstory, image_url, player_type } = req.body;

    const patch = {};
    if (name !== undefined) patch.name = sanitizeHtml(name);
    if (race !== undefined) patch.race = sanitizeHtml(race);
    if (klass !== undefined) patch.class = sanitizeHtml(klass);
    if (status !== undefined) patch.status = status ? sanitizeHtml(status) : null;
    if (location !== undefined) patch.location = location ? sanitizeHtml(location) : null;
    if (backstory !== undefined) patch.backstory = backstory ? sanitizeHtml(backstory) : null;
    if (image_url !== undefined) patch.image_url = image_url;
    if (player_type !== undefined) patch.player_type = sanitizeHtml(player_type);

    const { data, error } = await supabase
      .from('characters')
      .update(patch)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: 'Update character failed', error: e.message });
  }
});

// Delete character
app.delete('/api/characters/:id', async (req, res) => {
  const { error } = await supabase.from('characters').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: 'Delete character failed', error: error.message });
  res.status(204).send();
});

// ==============================
// Character <-> Session linking
// Table: note_characters (note_id, character_id)
// ==============================

// Add character to session
app.post('/api/notes/:noteId/characters', upload.none(), async (req, res) => {
  try {
    const { character_id } = req.body;
    const note_id = Number(req.params.noteId);

    const { data, error } = await supabase
      .from('note_characters')
      .insert({ note_id, character_id })
      .select()
      .single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ message: 'Link character to note failed', error: e.message });
  }
});

// Remove character from session
app.delete('/api/notes/:noteId/characters/:characterId', async (req, res) => {
  const { noteId, characterId } = req.params;
  const { error } = await supabase
    .from('note_characters')
    .delete()
    .match({ note_id: Number(noteId), character_id: Number(characterId) });
  if (error) return res.status(500).json({ message: 'Unlink failed', error: error.message });
  res.status(204).send();
});

// ==============================
// Optional: image upload to Vercel Blob (if you use it)
// ==============================
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const ext = path.extname(req.file.originalname).toLowerCase() || '.bin';
    const blobName = `characters/${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;

    const { url } = await put(blobName, req.file.buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    res.status(201).json({ url });
  } catch (e) {
    res.status(500).json({ message: 'Upload failed', error: e.message });
  }
});

// ----- IMPORTANT: do NOT call app.listen on Vercel
// Export a serverless handler so Vercel can invoke all HTTP methods correctly
try {
  // Prefer to use serverless-http when available in the deployed environment
  const serverless = require('serverless-http');
  module.exports = serverless(app);
} catch (e) {
  // Fallback for local development if serverless-http is not installed
  module.exports = app;
}

// If this file is run directly (for local development), start an HTTP server.
// This won't run on Vercel because the platform requires the exported handler.
if (require.main === module) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Local dev server listening on http://localhost:${port}`);
  });
}
