'use server';

import { Buffer } from 'node:buffer';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { put } from '@vercel/blob';
import {
  addCharacterToNote,
  deleteCharacter,
  deleteNote,
  insertCharacter,
  insertNote,
  removeCharacterFromNote,
  updateCharacter,
  updateNote
} from '@/lib/mutations';

export type ActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  id?: number;
};

async function uploadImage(file: File | null, folder: string) {
  if (!file || file.size === 0) {
    return null;
  }

  const arrayBuffer = await file.arrayBuffer();
  const ext = file.name?.split('.').pop() ?? 'bin';
  const blobName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { url } = await put(blobName, Buffer.from(arrayBuffer), {
    access: 'public'
  });

  return url;
}

function parseCharacterIds(formData: FormData) {
  return formData
    .getAll('characterIds')
    .map(value => Number(value))
    .filter(Boolean);
}

function parseSessionIds(formData: FormData) {
  return formData
    .getAll('sessionIds')
    .map(value => Number(value))
    .filter(Boolean);
}

export async function createNoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const title = formData.get('title');
  const date = formData.get('date');
  const content = formData.get('content');
  const imageFile = formData.get('image');

  if (typeof title !== 'string' || title.trim().length === 0) {
    return { status: 'error', message: 'Title is required.' };
  }
  if (typeof date !== 'string' || date.trim().length === 0) {
    return { status: 'error', message: 'Date is required.' };
  }

  let imageUrl: string | null = null;
  if (imageFile instanceof File) {
    imageUrl = await uploadImage(imageFile, 'sessions');
  }

  try {
    const inserted = await insertNote({
      title: title as string,
      date: date as string,
      content: typeof content === 'string' ? content : '',
      imageUrl,
      characterIds: parseCharacterIds(formData)
    });

  revalidatePath('/');
  revalidatePath('/sessions');
  revalidatePath(`/notes/${inserted.id}`);

  redirect(`/notes/${inserted.id}`);
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Failed to create session.' };
  }
}

export async function updateNoteAction(noteId: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const title = formData.get('title');
  const date = formData.get('date');
  const content = formData.get('content');
  const existingImageUrl = formData.get('existingImageUrl');
  const imageFile = formData.get('image');
  const removeImage = formData.get('removeImage');

  if (typeof title !== 'string' || title.trim().length === 0) {
    return { status: 'error', message: 'Title is required.' };
  }
  if (typeof date !== 'string' || date.trim().length === 0) {
    return { status: 'error', message: 'Date is required.' };
  }

  let imageUrl: string | null = typeof existingImageUrl === 'string' && existingImageUrl.length > 0 ? existingImageUrl : null;
  if (removeImage === 'true') {
    imageUrl = null;
  } else if (imageFile instanceof File && imageFile.size > 0) {
    imageUrl = await uploadImage(imageFile, 'sessions');
  }

  try {
    await updateNote(noteId, {
      title: title as string,
      date: date as string,
      content: typeof content === 'string' ? content : '',
      imageUrl,
      characterIds: parseCharacterIds(formData)
    });

    revalidatePath('/');
    revalidatePath('/sessions');
    revalidatePath(`/notes/${noteId}`);

    return { status: 'success', message: 'Session updated.', id: noteId };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Failed to update session.' };
  }
}

export async function deleteNoteAction(noteId: number) {
  await deleteNote(noteId);
  revalidatePath('/');
  revalidatePath('/sessions');
  redirect('/sessions');
}

export async function linkCharacterToNote(noteId: number, characterId: number) {
  try {
    await addCharacterToNote(noteId, characterId);
    revalidatePath(`/notes/${noteId}`);
    revalidatePath(`/characters/${characterId}`);
    return { status: 'success' } as ActionState;
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Failed to link character.' } as ActionState;
  }
}

export async function unlinkCharacterFromNote(noteId: number, characterId: number) {
  try {
    await removeCharacterFromNote(noteId, characterId);
    revalidatePath(`/notes/${noteId}`);
    revalidatePath(`/characters/${characterId}`);
    return { status: 'success' } as ActionState;
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Failed to unlink character.' } as ActionState;
  }
}

export async function createCharacterAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = formData.get('name');
  if (typeof name !== 'string' || name.trim().length === 0) {
    return { status: 'error', message: 'Name is required.' };
  }

  const imageFile = formData.get('image');
  let imageUrl: string | null = null;
  if (imageFile instanceof File) {
    imageUrl = await uploadImage(imageFile, 'characters');
  }

  try {
    const inserted = await insertCharacter({
      name: name as string,
      race: typeof formData.get('race') === 'string' ? (formData.get('race') as string) : null,
      class: typeof formData.get('class') === 'string' ? (formData.get('class') as string) : null,
      status: typeof formData.get('status') === 'string' ? (formData.get('status') as string) : null,
      location: typeof formData.get('location') === 'string' ? (formData.get('location') as string) : null,
      backstory: typeof formData.get('backstory') === 'string' ? (formData.get('backstory') as string) : null,
      playerType: typeof formData.get('playerType') === 'string' ? (formData.get('playerType') as string) : 'npc',
      imageUrl,
      sessionIds: parseSessionIds(formData)
    });

    revalidatePath('/characters');
    revalidatePath(`/characters/${inserted.id}`);

    redirect(`/characters/${inserted.id}`);
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Failed to create character.' };
  }
}

export async function updateCharacterAction(characterId: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = formData.get('name');
  if (typeof name !== 'string' || name.trim().length === 0) {
    return { status: 'error', message: 'Name is required.' };
  }

  const existingImageUrl = formData.get('existingImageUrl');
  const imageFile = formData.get('image');
  const removeImage = formData.get('removeImage');

  let imageUrl: string | null = typeof existingImageUrl === 'string' && existingImageUrl.length > 0 ? existingImageUrl : null;
  if (removeImage === 'true') {
    imageUrl = null;
  } else if (imageFile instanceof File && imageFile.size > 0) {
    imageUrl = await uploadImage(imageFile, 'characters');
  }

  try {
    await updateCharacter(characterId, {
      name: name as string,
      race: typeof formData.get('race') === 'string' ? (formData.get('race') as string) : null,
      class: typeof formData.get('class') === 'string' ? (formData.get('class') as string) : null,
      status: typeof formData.get('status') === 'string' ? (formData.get('status') as string) : null,
      location: typeof formData.get('location') === 'string' ? (formData.get('location') as string) : null,
      backstory: typeof formData.get('backstory') === 'string' ? (formData.get('backstory') as string) : null,
      playerType: typeof formData.get('playerType') === 'string' ? (formData.get('playerType') as string) : 'npc',
      imageUrl,
      sessionIds: parseSessionIds(formData)
    });

    revalidatePath('/characters');
    revalidatePath(`/characters/${characterId}`);
    revalidatePath('/sessions');

    return { status: 'success', message: 'Character updated.', id: characterId };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Failed to update character.' };
  }
}

export async function deleteCharacterAction(characterId: number) {
  await deleteCharacter(characterId);
  revalidatePath('/characters');
  redirect('/characters');
}
