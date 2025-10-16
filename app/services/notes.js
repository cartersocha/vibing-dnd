import { apiFetch, apiFetchRaw } from './api';

export async function fetchNotes() {
  return apiFetch('/notes');
}

export async function fetchNote(id) {
  return apiFetch(`/notes/${id}`);
}

export async function createNote(formData) {
  return apiFetch('/notes', {
    method: 'POST',
    body: formData,
  });
}

export async function updateNote(id, formData) {
  return apiFetch(`/notes/${id}`, {
    method: 'PUT',
    body: formData,
  });
}

export async function deleteNote(id) {
  await apiFetch(`/notes/${id}`, { method: 'DELETE' });
}

export async function addCharacterToSession(noteId, characterId) {
  return apiFetch(`/notes/${noteId}/characters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterId }),
  });
}

export async function removeCharacterFromSession(noteId, characterId) {
  await apiFetch(`/notes/${noteId}/characters/${characterId}`, { method: 'DELETE' });
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiFetchRaw('/upload', {
    method: 'POST',
    body: formData,
  });
  return response.json();
}
