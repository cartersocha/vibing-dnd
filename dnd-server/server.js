const express = require('express');
const cors = require('cors');
const sanitizeHtml = require('sanitize-html');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// --- Static File Serving for Production ---
// Serve uploaded images from the 'public/uploads' directory, making them available at /uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// Serve the built React app's static files
app.use(express.static(path.join(__dirname, '../dnd-client/build')));

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 } // 10MB limit
}).single('image'); // 'image' is the name of the form field

// --- In-Memory Database ---
let notes = [
  { id: 1, title: 'A Fateful Meeting', date: '2024-05-01', content: 'Our heroes met in the Prancing Pony tavern, unaware of the adventure that awaited them.', imageUrl: null },
  { id: 2, title: 'The Goblin Ambush', date: '2024-05-08', content: 'Traveling north, the party was ambushed by a band of goblins. They discovered a strange map on the leader.', imageUrl: null },
  { id: 3, title: 'The Whispering Cave', date: '2024-05-15', content: 'The map led to a dark cave, from which strange whispers could be heard on the wind.', imageUrl: null },
  { id: 4, title: 'The Cultist\'s Ritual', date: '2024-05-22', content: 'Deep inside the cave, the party stumbled upon a group of cultists performing a dark ritual.', imageUrl: null },
];
let characters = [
  { id: 1, name: 'Aelar', race: 'Elf', class: 'Ranger', status: 'Active', location: 'Neverwinter', backstory: 'A mysterious ranger from the north.', imageUrl: null, playerType: 'Player' }
];
let nextNoteId = 5;
let nextCharId = 2;
// Link table for Many-to-Many relationship
let sessionCharacters = [
  { sessionId: 1, characterId: 1 },
  { sessionId: 2, characterId: 1 },
];

// GET all notes
app.get('/api/notes', (req, res) => {
  const notesWithCharacters = notes.map(note => {
    const relatedCharacterIds = sessionCharacters
      .filter(sc => sc.sessionId === note.id)
      .map(sc => sc.characterId);

    const relatedCharacters = characters.filter(c => relatedCharacterIds.includes(c.id));

    return { ...note, characters: relatedCharacters };
  });

  res.json(notesWithCharacters);
});

// POST a new note
app.post('/api/notes', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error uploading file.', error: err });
    }
    const { title, content, date } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content required' });

    const existingNote = notes.find(note => note.title.toLowerCase() === title.toLowerCase());
    if (existingNote) {
      return res.status(409).json({ message: 'A session with this title already exists.' });
    }

    const sanitizedTitle = sanitizeHtml(title, { allowedTags: [], allowedAttributes: {} });
    const sanitizedContent = sanitizeHtml(content);
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newNote = { id: nextNoteId++, title: sanitizedTitle, date, content: sanitizedContent, imageUrl };
    notes.push(newNote);
    res.status(201).json(newNote);
  });
});

// PUT (update) a note
app.put('/api/notes/:id', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error uploading file.', error: err });
    }
    const noteId = parseInt(req.params.id);
    const noteIndex = notes.findIndex(n => n.id === noteId);

    if (noteIndex === -1) return res.status(404).json({ message: 'Note not found' });

    if (req.body.title) {
      const existingNote = notes.find(
        note => note.title.toLowerCase() === req.body.title.toLowerCase() && note.id !== noteId
      );
      if (existingNote) {
        return res.status(409).json({ message: 'Another session with this title already exists.' });
      }
    }

    const sanitizedBody = {};
    if (req.body.title) sanitizedBody.title = sanitizeHtml(req.body.title, { allowedTags: [], allowedAttributes: {} });
    if (req.body.content) sanitizedBody.content = sanitizeHtml(req.body.content);
    if (req.body.date) sanitizedBody.date = sanitizeHtml(req.body.date, { allowedTags: [], allowedAttributes: {} });

    const existingNote = notes[noteIndex];
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : existingNote.imageUrl;

    notes[noteIndex] = { 
      ...existingNote,
      ...sanitizedBody,
      imageUrl
    };

    res.json(notes[noteIndex]);
  });
});

// GET a single note with related characters
app.get('/api/notes/:id', (req, res) => {
  const noteId = parseInt(req.params.id);
  const note = notes.find(n => n.id === noteId);
  if (!note) return res.status(404).json({ message: 'Note not found' });

  const relatedCharacterIds = sessionCharacters
    .filter(sc => sc.sessionId === noteId)
    .map(sc => sc.characterId);

  const relatedCharacters = characters.filter(c => relatedCharacterIds.includes(c.id));

  res.json({ ...note, characters: relatedCharacters });
});

// DELETE a note
app.delete('/api/notes/:id', (req, res) => {
  const noteId = parseInt(req.params.id);
  notes = notes.filter(n => n.id !== noteId);
  res.status(204).send();
});

// --- CHARACTERS API ---

// GET all characters
app.get('/api/characters', (req, res) => {
  const charactersWithSessions = characters.map(character => {
    const relatedSessionIds = sessionCharacters
      .filter(sc => sc.characterId === character.id)
      .map(sc => sc.sessionId);

    const relatedSessions = notes.filter(n => relatedSessionIds.includes(n.id));

    return { ...character, sessions: relatedSessions };
  });

  res.json(charactersWithSessions);
});

// POST a new character
app.post('/api/characters', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error uploading file.', error: err });
    }
    const { name, race, class: charClass, status, location, backstory, playerType } = req.body;
    if (!name || !race || !charClass || !playerType) {
      return res.status(400).json({ message: 'Name, race, and class are required' });
    }

    const sanitizedBody = {};
    for (const key in req.body) {
      if (key === 'backstory') {
        sanitizedBody[key] = sanitizeHtml(req.body[key]); // Use default safe tags for backstory
      } else {
        sanitizedBody[key] = sanitizeHtml(req.body[key], { allowedTags: [], allowedAttributes: {} });
      }
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const newChar = { id: nextCharId++, ...sanitizedBody, imageUrl };
    characters.push(newChar);
    res.status(201).json(newChar);
  });
});

// PUT (update) a character
app.put('/api/characters/:id', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error uploading file.', error: err });
    }

    const charId = parseInt(req.params.id);
    const charIndex = characters.findIndex(c => c.id === charId);

    if (charIndex === -1) {
      return res.status(404).json({ message: 'Character not found' });
    }

    // Start with a copy of the existing character
    const existingChar = { ...characters[charIndex] };

    // Sanitize the incoming data
    const sanitizedBody = {};
    for (const key in req.body) {
      // Skip empty values unless they're intentionally falsy
      if (req.body[key] === null || req.body[key] === undefined) continue;

      if (key === 'backstory') {
        sanitizedBody[key] = sanitizeHtml(req.body[key]); // Use default safe tags for backstory
      } else if (key === 'id') {
        sanitizedBody[key] = parseInt(req.body[key]); // Keep the ID as a number
      } else {
        sanitizedBody[key] = sanitizeHtml(req.body[key], { allowedTags: [], allowedAttributes: {} });
      }
    }

    // Handle the image
    let imageUrl = existingChar.imageUrl; // Start with existing image
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`; // Use new uploaded image
    } else if (sanitizedBody.imageUrl) {
      imageUrl = sanitizedBody.imageUrl; // Use provided imageUrl
    }

    // Create the updated character, ensuring ID is preserved
    const updatedChar = {
      ...existingChar,
      ...sanitizedBody,
      imageUrl
    };

    // Update in the array
    characters[charIndex] = updatedChar;
    res.json(updatedChar);
  });
});

// GET a single character with related sessions
app.get('/api/characters/:id', (req, res) => {
  const charId = parseInt(req.params.id);
  const character = characters.find(c => c.id === charId);
  if (!character) return res.status(404).json({ message: 'Character not found' });

  const relatedSessionIds = sessionCharacters
    .filter(sc => sc.characterId === charId)
    .map(sc => sc.sessionId);

  const relatedSessions = notes.filter(n => relatedSessionIds.includes(n.id));

  res.json({ ...character, sessions: relatedSessions });
});

// DELETE a character
app.delete('/api/characters/:id', (req, res) => {
  const charId = parseInt(req.params.id);
  const initialLength = characters.length;
  characters = characters.filter(c => c.id !== charId);

  if (characters.length === initialLength) {
    return res.status(404).json({ message: 'Character not found' });
  }
  res.status(204).send();
});

// --- RELATIONSHIP API ---

// Add a character to a session
app.post('/api/notes/:noteId/characters', (req, res) => {
  const sessionId = parseInt(req.params.noteId);
  const { characterId } = req.body;

  const existing = sessionCharacters.find(sc => sc.sessionId === sessionId && sc.characterId === characterId);
  if (existing) return res.status(409).json({ message: 'Character already in this session' });

  sessionCharacters.push({ sessionId, characterId });
  res.status(201).json({ message: 'Character added to session' });
});

// Remove a character from a session
app.delete('/api/notes/:noteId/characters/:characterId', (req, res) => {
  const sessionId = parseInt(req.params.noteId);
  const characterId = parseInt(req.params.characterId);

  sessionCharacters = sessionCharacters.filter(
    sc => !(sc.sessionId === sessionId && sc.characterId === characterId)
  );

  res.status(204).send();
});

// The "catchall" handler: for any request that doesn't match one above,
// send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dnd-client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`)
});
