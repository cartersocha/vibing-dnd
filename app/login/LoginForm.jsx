'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from './actions';

const initialState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Checking...' : 'Enter'}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useFormState(authenticate, initialState);

  return (
    <div className="login-page-container">
      <div className="login-card">
        <form action={formAction}>
          <h2>Enter Access Code</h2>
          <div className="form-field">
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Password"
              autoFocus
            />
          </div>
          {state?.error ? (
            <p role="alert" style={{ color: '#FF9AA2', marginTop: '-0.5rem', marginBottom: '1rem' }}>
              {state.error}
            </p>
          ) : null}
          <div className="form-actions" style={{ justifyContent: 'center' }}>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
