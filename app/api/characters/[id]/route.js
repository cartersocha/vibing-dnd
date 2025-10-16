import { NextResponse } from 'next/server';
import { fetchCharacterById, updateCharacter, deleteCharacter } from '@/lib/data/characters';

export async function GET(_request, { params }) {
  try {
    const characterId = Number(params.id);
    const character = await fetchCharacterById(characterId);
    if (!character) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(character);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const characterId = Number(params.id);
    const payload = await request.json();
    const character = await updateCharacter(characterId, payload);
    return NextResponse.json(character);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const characterId = Number(params.id);
    await deleteCharacter(characterId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
