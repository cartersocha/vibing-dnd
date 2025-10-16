'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { Character, Note } from '@/lib/types';
import type { ActionState } from '@/components/actions';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Saving…' : label}
    </button>
  );
}

export default function CharacterEditor({
  title,
  character,
  notes,
  action,
  onCancel,
  onSuccess
}: {
  title: string;
  character?: Character;
  notes: Note[];
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const [removeImage, setRemoveImage] = useState(false);
  const [state, formAction] = useFormState<ActionState>(action, { status: 'idle' });
  const defaultSessions = character ? character.sessions.map(session => session.id) : [];

  useEffect(() => {
    if (state?.status === 'success' && onSuccess) {
      onSuccess();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="card" encType="multipart/form-data">
      <h2>{title}</h2>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="character-name">Name</label>
          <input
            id="character-name"
            name="name"
            type="text"
            className="form-input"
            defaultValue={character?.name ?? ''}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="character-race">Race</label>
          <input
            id="character-race"
            name="race"
            type="text"
            className="form-input"
            defaultValue={character?.race ?? ''}
          />
        </div>
        <div className="form-field">
          <label htmlFor="character-class">Class</label>
          <input
            id="character-class"
            name="class"
            type="text"
            className="form-input"
            defaultValue={character?.class ?? ''}
          />
        </div>
        <div className="form-field">
          <label htmlFor="character-status">Status</label>
          <input
            id="character-status"
            name="status"
            type="text"
            className="form-input"
            defaultValue={character?.status ?? ''}
          />
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="character-location">Location</label>
        <input
          id="character-location"
          name="location"
          type="text"
          className="form-input"
          defaultValue={character?.location ?? ''}
        />
      </div>
      <div className="form-field">
        <label htmlFor="character-player">Player Type</label>
        <select
          id="character-player"
          name="playerType"
          className="form-input"
          defaultValue={character?.playerType ?? 'npc'}
        >
          <option value="pc">Player Character</option>
          <option value="npc">Non-player Character</option>
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="character-backstory">Backstory</label>
        <textarea
          id="character-backstory"
          name="backstory"
          className="form-textarea"
          rows={8}
          defaultValue={character?.backstory ?? ''}
        />
      </div>
      <div className="form-section">
        <label htmlFor="character-image">Character Portrait</label>
        {character?.imageUrl && !removeImage && (
          <div className="current-image-preview">
            <img src={character.imageUrl} alt={character.name} className="character-image-preview" />
            <label className="checkbox-inline">
              <input
                type="checkbox"
                name="removeImage"
                value="true"
                checked={removeImage}
                onChange={event => setRemoveImage(event.target.checked)}
              />
              Remove existing image
            </label>
          </div>
        )}
        <input id="character-image" name="image" type="file" accept="image/png,image/jpeg,image/webp" />
        {character?.imageUrl && <input type="hidden" name="existingImageUrl" value={character.imageUrl ?? ''} />}
      </div>
      <div className="form-field">
        <label htmlFor="sessionIds">Sessions Appearing</label>
        <select
          id="sessionIds"
          name="sessionIds"
          multiple
          defaultValue={defaultSessions.map(String)}
          className="form-multiselect"
        >
          {notes.map(note => (
            <option key={note.id} value={note.id}>
              Session {note.sessionNumber ?? '?'} · {note.title}
            </option>
          ))}
        </select>
        <p className="form-helper-text">Hold Ctrl or Cmd to select multiple sessions.</p>
      </div>
      {state?.status === 'error' && <p className="form-error">{state.message ?? 'Something went wrong. Please try again.'}</p>}
      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ marginRight: '1rem' }}
          >
            Cancel
          </button>
        )}
        <SubmitButton label={character ? 'Save Changes' : 'Create Character'} />
      </div>
    </form>
  );
}
