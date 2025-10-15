import api from '../api';

export const fetchNotes = async () => {
  const response = await api.get('/notes');
  return response.data;
};

export const createNote = async (formData) => {
  const response = await api.post('/notes', formData);
  return response.data;
};

export const updateNote = async (id, formData) => {
  const response = await api.put(`/notes/${id}`, formData);
  return response.data;
};

export const deleteNote = async (id) => {
  await api.delete(`/notes/${id}`);
};

export const addCharacterToSession = async (noteId, characterId) => {
  const response = await api.post(`/notes/${noteId}/characters`, { characterId });
  return response.data;
};

export const removeCharacterFromSession = async (noteId, characterId) => {
  await api.delete(`/notes/${noteId}/characters/${characterId}`);
};