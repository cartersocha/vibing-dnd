import { NextResponse } from 'next/server';
import { deleteCharacter, updateCharacter } from '@/lib/mutations';
import { getCharacterById } from '@/lib/data';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const character = await getCharacterById(Number(params.id));
    if (!character) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(character);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load character.' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      race = null,
      class: klass = null,
      status = null,
      location = null,
      backstory = null,
      playerType = 'npc',
      imageUrl = null,
      sessionIds
    } = body ?? {};

    if (!name) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    await updateCharacter(Number(params.id), {
      name,
      race,
      class: klass,
      status,
      location,
      backstory,
      playerType,
      imageUrl,
      sessionIds: Array.isArray(sessionIds) ? sessionIds.map(Number).filter(Boolean) : undefined
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update character.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteCharacter(Number(params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete character.' }, { status: 500 });
  }
}
