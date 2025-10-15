const { createClient } = require('@supabase/supabase-js');
const formidable = require('formidable');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	console.error('Missing SUPABASE env vars for client wrappers');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = async (req, res) => {
	try {
		if (req.method === 'GET') {
			// Return list of notes with their related characters
			const { data: notes, error } = await supabase
				.from('notes')
				.select(`
					*,
					session_characters(
						character_id,
						characters(*)
					)
				`);

			if (error) throw error;

			const notesWithCharacters = notes.map(note => ({
				id: note.id,
				title: note.title,
				date: note.date,
				content: note.content,
				imageUrl: note.image_url,
				characters: (note.session_characters || []).map(sc => ({
					id: sc.characters.id,
					name: sc.characters.name,
					race: sc.characters.race,
					class: sc.characters.class,
					status: sc.characters.status,
					location: sc.characters.location,
					backstory: sc.characters.backstory,
					imageUrl: sc.characters.image_url,
					playerType: sc.characters.player_type
				}))
			}));

			return res.status(200).json(notesWithCharacters);
		}

		if (req.method === 'POST') {
			const form = new formidable.IncomingForm();
			form.parse(req, async (err, fields, files) => {
				if (err) return res.status(500).json({ message: 'Error parsing form', error: err.message });

				try {
					const { data, error } = await supabase
						.from('notes')
						.insert({
							title: fields.title || 'Untitled',
							date: fields.date || null,
							content: fields.content || ''
						})
						.select()
						.single();

					if (error) throw error;
					return res.status(201).json(data);
				} catch (e) {
					console.error('Error creating note (wrapper):', e.message || e);
					return res.status(500).json({ message: 'Error creating note', error: e.message || e });
				}
			});
			return;
		}

		res.setHeader('Allow', 'GET, POST');
		res.status(405).send('Method Not Allowed');
	} catch (e) {
		console.error('Wrapper notes handler unexpected error:', e);
		res.status(500).json({ message: 'Unexpected error', error: e.message || e });
	}
};
