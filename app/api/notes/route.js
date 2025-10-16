import { NextResponse } from 'next/server';
import { fetchNotesWithRelations, createNote } from '@/lib/data/notes';

export async function GET() {
  try {
    const notes = await fetchNotesWithRelations();
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const note = await createNote(payload);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
