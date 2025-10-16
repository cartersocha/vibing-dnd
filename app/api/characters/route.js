import { NextResponse } from 'next/server';
import { fetchCharactersWithRelations, createCharacter } from '@/lib/data/characters';

export async function GET() {
  try {
    const characters = await fetchCharactersWithRelations();
    return NextResponse.json(characters);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const character = await createCharacter(payload);
    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
