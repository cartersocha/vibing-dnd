'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import {
  createCharacter,
  updateCharacter,
  deleteCharacter
} from '@/lib/data/characters';

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

function parseSessionIds(formData) {
  return formData
    .getAll('sessionIds')
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));
}

function revalidateCharacterPaths(characterId) {
  revalidatePath('/characters');
  if (characterId) {
    revalidatePath(`/characters/${characterId}`);
  }
  revalidatePath('/sessions');
  revalidatePath('/');
}

export async function createCharacterAction(formData) {
  try {
    const name = formData.get('name');
    const race = formData.get('race');
    const klass = formData.get('class');
    const status = formData.get('status');
    const location = formData.get('location');
    const backstory = formData.get('backstory');
    const playerType = formData.get('playerType');
    const sessionIds = parseSessionIds(formData);
    const existingImageUrl = formData.get('existingImageUrl');
    const imageFile = formData.get('image');

    let imageUrl = existingImageUrl ? existingImageUrl.toString() : null;
    const uploaded = await uploadImage(imageFile, 'characters');
    if (uploaded) {
      imageUrl = uploaded;
    }

    const character = await createCharacter({
      name,
      race,
      class: klass,
      status,
      location,
      backstory,
      playerType,
      sessionIds,
      imageUrl
    });

    revalidateCharacterPaths(character?.id);
    return { success: true, characterId: character?.id };
  } catch (error) {
    return { error: error.message || 'Failed to create character.' };
  }
}

export async function updateCharacterAction(formData) {
  try {
    const id = Number(formData.get('id'));
    const name = formData.get('name');
    const race = formData.get('race');
    const klass = formData.get('class');
    const status = formData.get('status');
    const location = formData.get('location');
    const backstory = formData.get('backstory');
    const playerType = formData.get('playerType');
    const sessionIds = parseSessionIds(formData);
    const existingImageUrl = formData.get('existingImageUrl');
    const imageFile = formData.get('image');

    let imageUrl = existingImageUrl ? existingImageUrl.toString() : null;
    const uploaded = await uploadImage(imageFile, 'characters');
    if (uploaded) {
      imageUrl = uploaded;
    }

    const character = await updateCharacter(id, {
      name,
      race,
      class: klass,
      status,
      location,
      backstory,
      playerType,
      sessionIds,
      imageUrl
    });

    revalidateCharacterPaths(id);
    return { success: true, characterId: character?.id };
  } catch (error) {
    return { error: error.message || 'Failed to update character.' };
  }
}

export async function deleteCharacterAction(characterId) {
  try {
    await deleteCharacter(characterId);
    revalidateCharacterPaths(characterId);
    return { success: true };
  } catch (error) {
    return { error: error.message || 'Failed to delete character.' };
  }
}
