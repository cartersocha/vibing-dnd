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
			const { data: characters, error } = await supabase
				.from('characters')
				.select(`
					*,
					session_characters(
						session_id,
						notes(*)
					)
				`);

			if (error) throw error;

			const charactersWithSessions = characters.map(character => ({
				id: character.id,
				name: character.name,
				race: character.race,
				class: character.class,
				status: character.status,
				location: character.location,
				backstory: character.backstory,
				imageUrl: character.image_url,
				playerType: character.player_type,
				sessions: (character.session_characters || []).map(sc => sc.notes)
			}));

			return res.status(200).json(charactersWithSessions);
		}

		if (req.method === 'POST') {
			const form = new formidable.IncomingForm();
			form.parse(req, async (err, fields, files) => {
				if (err) return res.status(500).json({ message: 'Error parsing form', error: err.message });

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
					return res.status(201).json(data);
				} catch (e) {
					console.error('Error creating character (wrapper):', e.message || e);
					return res.status(500).json({ message: 'Error creating character', error: e.message || e });
				}
			});
			return;
		}

		res.setHeader('Allow', 'GET, POST');
		res.status(405).send('Method Not Allowed');
	} catch (e) {
		console.error('Wrapper characters handler unexpected error:', e);
		res.status(500).json({ message: 'Unexpected error', error: e.message || e });
	}
};
