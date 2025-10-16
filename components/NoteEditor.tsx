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

export default function NoteEditor({
  title,
  note,
  characters,
  action,
  onCancel,
  onSuccess
}: {
  title: string;
  note?: Note;
  characters: Character[];
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const [removeImage, setRemoveImage] = useState(false);
  const [state, formAction] = useFormState<ActionState>(action, { status: 'idle' });

  const defaultCharacterIds = note ? note.characters.map(character => character.id) : [];

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
          <label htmlFor="note-title">Session Title</label>
          <input
            id="note-title"
            name="title"
            type="text"
            className="form-input"
            defaultValue={note?.title ?? ''}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="note-date">Session Date</label>
          <input
            id="note-date"
            name="date"
            type="date"
            className="form-input"
            defaultValue={note?.date ?? new Date().toISOString().split('T')[0]}
            required
          />
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="note-content">Session Details</label>
        <textarea
          id="note-content"
          name="content"
          className="form-textarea"
          rows={12}
          defaultValue={note?.content ?? ''}
          required
        />
      </div>
      <div className="form-section">
        <label htmlFor="note-image">Session Banner</label>
        {note?.imageUrl && !removeImage && (
          <div className="current-image-preview">
            <img src={note.imageUrl} alt="Session" className="character-image-preview" />
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
        <input id="note-image" name="image" type="file" accept="image/png,image/jpeg,image/webp" />
        {note?.imageUrl && <input type="hidden" name="existingImageUrl" value={note.imageUrl ?? ''} />}
      </div>
      <div className="form-field">
        <label htmlFor="characterIds">Characters in this Session</label>
        <select
          id="characterIds"
          name="characterIds"
          multiple
          defaultValue={defaultCharacterIds.map(String)}
          className="form-multiselect"
        >
          {characters.map(character => (
            <option key={character.id} value={character.id}>
              {character.name}
            </option>
          ))}
        </select>
        <p className="form-helper-text">Hold Ctrl or Cmd to select multiple characters.</p>
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
        <SubmitButton label={note ? 'Save Changes' : 'Create Session'} />
      </div>
    </form>
  );
}
