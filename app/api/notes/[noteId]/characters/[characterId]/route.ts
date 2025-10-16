import { NextResponse } from 'next/server';
import { removeCharacterFromNote } from '@/lib/mutations';

export async function DELETE(
  _request: Request,
  { params }: { params: { noteId: string; characterId: string } }
) {
  try {
    await removeCharacterFromNote(Number(params.noteId), Number(params.characterId));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to unlink character.' }, { status: 500 });
  }
}
