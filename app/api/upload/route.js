import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = file.name?.split('.').pop() ? `.${file.name.split('.').pop()}` : '';
  const blobName = `uploads/${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;

  const { url } = await put(blobName, buffer, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: file.type,
  });

  return NextResponse.json({ url });
}
