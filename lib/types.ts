export interface CharacterSummary {
  id: number;
  name: string;
  imageUrl: string | null;
  status: string | null;
  playerType: string | null;
}

export interface SessionSummary {
  id: number;
  title: string;
  date: string;
}

export interface Note {
  id: number;
  title: string;
  date: string;
  content: string;
  imageUrl: string | null;
  characters: CharacterSummary[];
  sessionNumber?: number;
}

export interface Character {
  id: number;
  name: string;
  race: string | null;
  class: string | null;
  status: string | null;
  location: string | null;
  backstory: string | null;
  imageUrl: string | null;
  playerType: string | null;
  sessions: SessionSummary[];
}
