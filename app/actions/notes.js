'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import {
  createNote,
  updateNote,
  deleteNote,
  addCharacterToNote,
  removeCharacterFromNote
} from '@/lib/data/notes';

async function uploadImage(file, folder) {
  if (!file || typeof file === 'string') return null;
  if (typeof file.arrayBuffer !== 'function') return null;
  const size = file.size || 0;
  if (size === 0) return null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name?.split('.').pop()?.toLowerCase() || 'bin';
  const key = `${folder}/${Date.now()}-${randomUUID()}.${ext}`;

  const { url } = await put(key, buffer, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN
  });

  return url;
}

function parseCharacterIds(formData) {
  return formData
    .getAll('characterIds')
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));
}

function normalizeDate(value) {
  if (!value) return null;
  return new Date(value).toISOString().split('T')[0];
}

function revalidateCampaignPaths(noteId) {
  revalidatePath('/');
  revalidatePath('/sessions');
  if (noteId) {
    revalidatePath(`/sessions/${noteId}`);
  }
  revalidatePath('/characters');
}

export async function createNoteAction(formData) {
  try {
    const title = formData.get('title');
    const date = normalizeDate(formData.get('date'));
    const content = formData.get('content');
    const characterIds = parseCharacterIds(formData);
    const existingImageUrl = formData.get('existingImageUrl');
    const imageFile = formData.get('image');

    let imageUrl = existingImageUrl ? existingImageUrl.toString() : null;
    const uploaded = await uploadImage(imageFile, 'notes');
    if (uploaded) {
      imageUrl = uploaded;
    }

    const note = await createNote({
      title,
      date,
      content,
      imageUrl,
      characterIds
    });

    revalidateCampaignPaths(note?.id);
    return { success: true, noteId: note?.id };
  } catch (error) {
    return { error: error.message || 'Failed to create session note.' };
  }
}

export async function updateNoteAction(formData) {
  try {
    const id = Number(formData.get('id'));
    const title = formData.get('title');
    const date = normalizeDate(formData.get('date'));
    const content = formData.get('content');
    const characterIds = parseCharacterIds(formData);
    const existingImageUrl = formData.get('existingImageUrl');
    const imageFile = formData.get('image');

    let imageUrl = existingImageUrl ? existingImageUrl.toString() : null;
    const uploaded = await uploadImage(imageFile, 'notes');
    if (uploaded) {
      imageUrl = uploaded;
    }

    const note = await updateNote(id, {
      title,
      date,
      content,
      imageUrl,
      characterIds
    });

    revalidateCampaignPaths(id);
    return { success: true, noteId: note?.id };
  } catch (error) {
    return { error: error.message || 'Failed to update session note.' };
  }
}

export async function deleteNoteAction(noteId) {
  try {
    await deleteNote(noteId);
    revalidateCampaignPaths(noteId);
    return { success: true };
  } catch (error) {
    return { error: error.message || 'Failed to delete session note.' };
  }
}

export async function addCharacterToNoteAction(noteId, characterId) {
  try {
    await addCharacterToNote(noteId, characterId);
    revalidateCampaignPaths(noteId);
    return { success: true };
  } catch (error) {
    return { error: error.message || 'Failed to link character.' };
  }
}

export async function removeCharacterFromNoteAction(noteId, characterId) {
  try {
    await removeCharacterFromNote(noteId, characterId);
    revalidateCampaignPaths(noteId);
    return { success: true };
  } catch (error) {
    return { error: error.message || 'Failed to unlink character.' };
  }
}
