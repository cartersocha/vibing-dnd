'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NoteForm from './NoteForm';
import * as noteService from '../services/notes';

export default function CreateNote({ characters }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (formData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (formData.imageFile) {
        const upload = await noteService.uploadImage(formData.imageFile);
        imageUrl = upload.url;
      }

      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('date', formData.date);
      payload.append('content', formData.content);
      if (imageUrl) {
        payload.append('imageUrl', imageUrl);
      }
      formData.characterIds.forEach((id) => payload.append('characterIds', String(id)));

      const created = await noteService.createNote(payload);
      router.push(`/notes/${created.id}`);
    } catch (error) {
      console.error('Error creating note:', error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <NoteForm
      note={{}}
      characters={characters}
      onSave={handleSave}
      onCancel={() => router.push('/sessions')}
    />
  );
}
