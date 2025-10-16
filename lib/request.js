export async function parseRequestBody(request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const json = await request.json();
    return json || {};
  }

  const formData = await request.formData();
  const body = {};
  for (const [key, value] of formData.entries()) {
    if (body[key]) {
      body[key] = Array.isArray(body[key]) ? [...body[key], value] : [body[key], value];
    } else {
      body[key] = value;
    }
  }
  return body;
}

export function normalizeIds(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((v) => !Number.isNaN(v));
  }
  return [];
}
