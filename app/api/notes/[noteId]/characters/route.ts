import { NextResponse } from 'next/server';
import { addCharacterToNote } from '@/lib/mutations';

export async function POST(
  request: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const body = await request.json();
    const { characterId } = body ?? {};
    if (!characterId) {
      return NextResponse.json({ error: 'characterId is required.' }, { status: 400 });
    }
    await addCharacterToNote(Number(params.noteId), Number(characterId));
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to link character.' }, { status: 500 });
  }
}
