import { NextResponse } from 'next/server';
import { fetchNoteById, updateNote, deleteNote } from '@/lib/data/notes';

export async function GET(_request, { params }) {
  try {
    const noteId = Number(params.id);
    const note = await fetchNoteById(noteId);
    if (!note) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const noteId = Number(params.id);
    const payload = await request.json();
    const note = await updateNote(noteId, payload);
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const noteId = Number(params.id);
    await deleteNote(noteId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
