import { NextResponse } from 'next/server';
import { deleteNote, updateNote } from '@/lib/mutations';
import { getNoteById } from '@/lib/data';

export async function GET(
  _request: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const note = await getNoteById(Number(params.noteId));
    if (!note) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load note.' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const body = await request.json();
    const { title, date, content, imageUrl = null, characterIds } = body ?? {};
    if (!title || !date) {
      return NextResponse.json({ error: 'Title and date are required.' }, { status: 400 });
    }

    await updateNote(Number(params.noteId), {
      title,
      date,
      content: typeof content === 'string' ? content : '',
      imageUrl,
      characterIds: Array.isArray(characterIds) ? characterIds.map(Number).filter(Boolean) : undefined
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update note.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    await deleteNote(Number(params.noteId));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete note.' }, { status: 500 });
  }
}
