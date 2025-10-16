import { apiFetch, apiFetchRaw } from './api';

export async function fetchCharacters() {
  return apiFetch('/characters');
}

export async function fetchCharacter(id) {
  return apiFetch(`/characters/${id}`);
}

export async function createCharacter(formData) {
  return apiFetch('/characters', {
    method: 'POST',
    body: formData,
  });
}

export async function updateCharacter(id, formData) {
  return apiFetch(`/characters/${id}`, {
    method: 'PUT',
    body: formData,
  });
}

export async function deleteCharacter(id) {
  await apiFetch(`/characters/${id}`, { method: 'DELETE' });
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
