import api from '../api';

export const fetchCharacters = async () => {
  const response = await api.get('/characters');
  return response.data;
};

export const createCharacter = async (formData) => {
  const response = await api.post('/characters', formData);
  return response; // Keep returning the full response for now
};

export const updateCharacter = async (id, formData) => {
  const response = await api.put(`/characters/${id}`, formData);
  return response.data;
};

export const deleteCharacter = async (id) => {
  await api.delete(`/characters/${id}`);
};