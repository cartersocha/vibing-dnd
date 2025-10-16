'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CharacterForm from './CharacterForm';
import * as characterService from '../services/characters';

export default function CreateCharacter({ notes }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (formData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (formData.imageFile) {
        const upload = await characterService.uploadImage(formData.imageFile);
        imageUrl = upload.url;
      }

      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('status', formData.status);
      payload.append('location', formData.location || '');
      payload.append('race', formData.race);
      payload.append('class', formData.class);
      payload.append('playerType', formData.playerType);
      payload.append('backstory', formData.backstory || '');
      if (imageUrl) {
        payload.append('imageUrl', imageUrl);
      }
      formData.sessionIds.forEach((id) => payload.append('sessionIds', String(id)));

      const created = await characterService.createCharacter(payload);
      router.push(`/characters/${created.id}`);
    } catch (error) {
      console.error('Error creating character:', error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CharacterForm
      character={{}}
      notes={notes}
      onSave={handleSave}
      onCancel={() => router.push('/characters')}
    />
  );
}
