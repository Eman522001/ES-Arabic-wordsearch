export const ARABIC_NUMBERS: Record<string, string> = {
  '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
  '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',
};

export const ARABIC_ALPHABET = Array.from("أبتثجحخدذرزسشصضطظعغفقكلمنهوي");

export function toArabicNumeral(num: number): string {
  return String(num)
    .split('')
    .map((d) => ARABIC_NUMBERS[d] ?? d)
    .join('');
}

export interface WordPlacement {
  word: string;
  positions: [number, number][];
}

export interface PuzzleState {
  size: number;
  grid: string[][];
  usedWords: string[];
  unusedWords: string[];
  secretWord: string;
  secretPositions: [number, number][];
  wordPlacements: WordPlacement[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ALL_DIRECTIONS: [number, number][] = [
  [0, 1],   // أفقي يسار→يمين
  [0, -1],  // أفقي يمين→يسار
  [1, 0],   // رأسي أعلى→أسفل
  [-1, 0],  // رأسي أسفل→أعلى
  [1, 1],   // قطري ↘
  [1, -1],  // قطري ↙
  [-1, 1],  // قطري ↗
  [-1, -1], // قطري ↖
];

function placeWord(
  grid: string[][],
  word: string,
  size: number,
): [number, number][] | null {
  const dirs = shuffle([...ALL_DIRECTIONS]);

  for (let attempt = 0; attempt < 200; attempt++) {
    const [dRow, dCol] = dirs[attempt % dirs.length];
    const startRow = Math.floor(Math.random() * size);
    const startCol = Math.floor(Math.random() * size);

    const endRow = startRow + dRow * (word.length - 1);
    const endCol = startCol + dCol * (word.length - 1);

    if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;

    let canPlace = true;
    for (let i = 0; i < word.length; i++) {
      const r = startRow + i * dRow;
      const c = startCol + i * dCol;
      if (grid[r][c] !== ' ') {
        canPlace = false;
        break;
      }
    }

    if (canPlace) {
      const positions: [number, number][] = [];
      for (let i = 0; i < word.length; i++) {
        const r = startRow + i * dRow;
        const c = startCol + i * dCol;
        grid[r][c] = word[i];
        positions.push([r, c]);
      }
      return positions;
    }
  }
  return null;
}

export function generatePuzzle(
  size: number,
  words: string[],
  secretWord: string,
): PuzzleState {
  const cleanSecret = secretWord.replace(/\s/g, '');
  const grid: string[][] = Array.from({ length: size }, () =>
    Array(size).fill(' '),
  );
  const usedWords: string[] = [];
  const unusedWords: string[] = [];
  const wordPlacements: WordPlacement[] = [];

  for (const word of words) {
    const clean = word.replace(/\s/g, '');
    if (clean.length === 0) continue;
    const positions = placeWord(grid, clean, size);
    if (positions) {
      usedWords.push(word);
      wordPlacements.push({ word, positions });
    } else {
      unusedWords.push(word);
    }
  }

  let emptyCells: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === ' ') emptyCells.push([r, c]);
    }
  }

  emptyCells = shuffle(emptyCells);

  const secretPositions: [number, number][] = [];
  for (const char of cleanSecret) {
    if (emptyCells.length === 0) break;
    const [r, c] = emptyCells.shift()!;
    grid[r][c] = char;
    secretPositions.push([r, c]);
  }

  for (const [r, c] of emptyCells) {
    grid[r][c] = ARABIC_ALPHABET[Math.floor(Math.random() * ARABIC_ALPHABET.length)];
  }

  return {
    size,
    grid,
    usedWords,
    unusedWords,
    secretWord: cleanSecret,
    secretPositions,
    wordPlacements,
  };
}
