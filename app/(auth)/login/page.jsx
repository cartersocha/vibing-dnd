'use client';

import { useFormState } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { loginAction } from './actions';

const initialState = { error: '' };

export default function LoginPage() {
  const search = useSearchParams();
  const redirect = search.get('redirect') || '/';
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <main className="login-page-container">
      <div className="login-card">
        <form action={formAction} className="login-form">
          <input type="hidden" name="redirect" value={redirect} />
          <h2>Enter Access Code</h2>
          <div className="form-field">
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Password"
              autoFocus
              required
            />
          </div>
          {state?.error && <p className="error-text">{state.error}</p>}
          <div className="form-actions" style={{ justifyContent: 'center' }}>
            <button type="submit" className="btn btn-primary">
              Enter
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
