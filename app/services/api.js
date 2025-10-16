export async function apiFetch(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error.message || `Request to ${path} failed`;
    throw new Error(message);
  }

  return response.json();
}

export async function apiFetchRaw(path, options = {}) {
  const response = await fetch(`/api${path}`, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error.message || `Request to ${path} failed`;
    throw new Error(message);
  }
  return response;
}
