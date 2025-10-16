import { NextResponse } from 'next/server';
import { insertNote } from '@/lib/mutations';
import { getNotes } from '@/lib/data';

export async function GET() {
  try {
    const notes = await getNotes();
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load notes.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, date, content, imageUrl = null, characterIds = [] } = body ?? {};

    if (!title || !date) {
      return NextResponse.json({ error: 'Title and date are required.' }, { status: 400 });
    }

    const note = await insertNote({
      title,
      date,
      content: typeof content === 'string' ? content : '',
      imageUrl,
      characterIds: Array.isArray(characterIds) ? characterIds.map(Number).filter(Boolean) : []
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create note.' }, { status: 500 });
  }
}
