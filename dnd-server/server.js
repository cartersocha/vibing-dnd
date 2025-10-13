const express = require('express');
const cors = require('cors');
const sanitizeHtml = require('sanitize-html');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// --- In-Memory Database ---
let notes = [
  { id: 1, title: 'Session 1: A Fateful Meeting', content: 'Our heroes met in the Prancing Pony tavern, unaware of the adventure that awaited them.' },
  { id: 2, title: 'Session 2: The Goblin Ambush', content: 'Traveling north, the party was ambushed by a band of goblins. They discovered a strange map on the leader.' },
  { id: 3, title: 'Session 3: The Whispering Cave', content: 'The map led to a dark cave, from which strange whispers could be heard on the wind.' },
  { id: 4, title: 'Session 4: The Cultist\'s Ritual', content: 'Deep inside the cave, the party stumbled upon a group of cultists performing a dark ritual.' },
];
let nextId = 5;

// --- API Endpoints ---

// GET all notes
app.get('/api/notes', (req, res) => res.json(notes));

// POST a new note
app.post('/api/notes', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ message: 'Title and content required' });

  // Check for duplicate title (case-insensitive)
  const existingNote = notes.find(note => note.title.toLowerCase() === title.toLowerCase());
  if (existingNote) {
    return res.status(409).json({ message: 'A session with this title already exists.' });
  }
  
  // Sanitize input to prevent XSS by stripping all HTML tags
  const sanitizedTitle = sanitizeHtml(title, { allowedTags: [], allowedAttributes: {} });
  const sanitizedContent = sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} });

  const newNote = { id: nextId++, title: sanitizedTitle, content: sanitizedContent };
  notes.push(newNote);
  res.status(201).json(newNote); // Respond with the sanitized note
});

// PUT (update) a note
app.put('/api/notes/:id', (req, res) => {
  const noteId = parseInt(req.params.id);
  const noteIndex = notes.findIndex(n => n.id === noteId);

  if (noteIndex === -1) return res.status(404).json({ message: 'Note not found' });

  // If title is being updated, check for duplicates on other notes
  if (req.body.title) {
    const existingNote = notes.find(
      note => note.title.toLowerCase() === req.body.title.toLowerCase() && note.id !== noteId
    );
    if (existingNote) {
      return res.status(409).json({ message: 'Another session with this title already exists.' });
    }
  }

  // Sanitize any fields present in the request body
  const sanitizedBody = {};
  if (req.body.title) sanitizedBody.title = sanitizeHtml(req.body.title, { allowedTags: [], allowedAttributes: {} });
  if (req.body.content) sanitizedBody.content = sanitizeHtml(req.body.content, { allowedTags: [], allowedAttributes: {} });

  notes[noteIndex] = { ...notes[noteIndex], ...sanitizedBody };
  res.json(notes[noteIndex]);
});

// DELETE a note
app.delete('/api/notes/:id', (req, res) => {
  const noteId = parseInt(req.params.id);
  notes = notes.filter(n => n.id !== noteId);
  res.status(204).send();
});

app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
