const { createClient } = require('@supabase/supabase-js');
const formidable = require('formidable');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ message: 'Error parsing form', error: err.message });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ message: 'Missing SUPABASE env vars' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
      const { data, error } = await supabase
        .from('characters')
        .insert({
          name: fields.name || 'Unnamed',
          race: fields.race || '',
          class: fields.class || '',
          status: fields.status || null,
          location: fields.location || null,
          backstory: fields.backstory || null,
          player_type: fields.playerType || 'Player'
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (e) {
      console.error('Error creating character (wrapper):', e.message || e);
      res.status(500).json({ message: 'Error creating character', error: e.message || e });
    }
  });
};
