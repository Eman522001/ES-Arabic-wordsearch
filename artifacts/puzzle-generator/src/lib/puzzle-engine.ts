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

export interface PuzzleState {
  size: number;
  grid: string[][];
  usedWords: string[];
  unusedWords: string[];
  secretWord: string;
  secretPositions: [number, number][];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function placeWord(grid: string[][], word: string, size: number): boolean {
  const directions: [number, number][] = shuffle([[0, 1], [1, 0]]);

  for (let attempt = 0; attempt < 100; attempt++) {
    const [dRow, dCol] = directions[Math.floor(Math.random() * directions.length)];
    const startRow = Math.floor(Math.random() * size);
    const startCol = Math.floor(Math.random() * size);

    const endRow = startRow + dRow * (word.length - 1);
    const endCol = startCol + dCol * (word.length - 1);

    if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;

    let canPlace = true;
    for (let i = 0; i < word.length; i++) {
      const r = startRow + i * dRow;
      const c = startCol + i * dCol;
      if (grid[r][c] !== ' ' && grid[r][c] !== word[i]) {
        canPlace = false;
        break;
      }
    }

    if (canPlace) {
      for (let i = 0; i < word.length; i++) {
        const r = startRow + i * dRow;
        const c = startCol + i * dCol;
        grid[r][c] = word[i];
      }
      return true;
    }
  }
  return false;
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

  for (const word of words) {
    const clean = word.replace(/\s/g, '');
    if (clean.length === 0) continue;
    if (placeWord(grid, clean, size)) {
      usedWords.push(word);
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
  };
}
