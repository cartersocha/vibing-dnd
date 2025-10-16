'use client';

import { useEffect, useState } from 'react';

const ACCESS_PASSWORD = 'rat palace';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('dnd-app-authenticated') === 'true' : false;
    setIsAuthed(stored);
    setChecked(true);
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get('password');
    if (password === ACCESS_PASSWORD) {
      sessionStorage.setItem('dnd-app-authenticated', 'true');
      setIsAuthed(true);
      setError(null);
    } else {
      setError('Incorrect password.');
    }
  };

  if (!checked) {
    return null;
  }

  if (!isAuthed) {
    return (
      <div className="login-page-container">
        <div className="login-card">
          <form onSubmit={handleSubmit} className="card">
            <h2>Enter Access Code</h2>
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" className="form-input" autoFocus required />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions" style={{ justifyContent: 'center' }}>
              <button type="submit" className="btn btn-primary">Enter</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
