export interface MemoryItem {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  story: string;
  imageUrl?: string;
  tags?: string[];
  rotationDeg?: number;
}

export interface InsideJokeItem {
  id: string;
  symbol: string;
  title: string;
  clue: string;
  revelation: string;
  personalNote: string;
}

export interface LetterItem {
  id: string;
  category: string;
  title: string;
  envelopeColor: 'navy' | 'crimson' | 'parchment' | 'emerald' | 'amber';
  content: string[];
  postscript?: string;
}

export interface UniverseData {
  recipientName: string;
  senderName: string;
  anniversaryDate: string;
  firstMetLocation: string;
  opening: {
    lead: string;
    sub: string;
    buttonText: string;
  };
  mainLetter: {
    greeting: string;
    paragraphs: string[];
    signature: string;
    date: string;
  };
  memories: MemoryItem[];
  insideJokes: InsideJokeItem[];
  letters: LetterItem[];
  finalLetter: {
    title: string;
    paragraphs: string[];
    constellationName: string;
    finalWords: string;
  };
  soundtrack: {
    mode: 'synth' | 'audioUrl';
    audioUrl: string;
    trackName: string;
    composer: string;
  };
}

export type SceneId = 'opening' | 'envelope' | 'scrapbook' | 'secrets' | 'treasure' | 'final';
