import { NextResponse } from 'next/server';
import { getCharacters } from '@/lib/data';
import { insertCharacter } from '@/lib/mutations';

export async function GET() {
  try {
    const characters = await getCharacters();
    return NextResponse.json(characters);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load characters.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
      sessionIds = []
    } = body ?? {};

    if (!name) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    const character = await insertCharacter({
      name,
      race,
      class: klass,
      status,
      location,
      backstory,
      playerType,
      imageUrl,
      sessionIds: Array.isArray(sessionIds) ? sessionIds.map(Number).filter(Boolean) : []
    });

    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create character.' }, { status: 500 });
  }
}
