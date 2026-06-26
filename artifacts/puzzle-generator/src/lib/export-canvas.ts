import jsPDF from "jspdf";
import type { PuzzleState } from "./puzzle-engine";
import { toArabicNumeral } from "./puzzle-engine";

const CELL = 52;
const MARGIN = 60;
const HEADER_H = 80;
const FOOTER_H = 130;

export const HIGHLIGHT_COLORS = [
  "rgba(255,235,59,0.55)",   // yellow
  "rgba(100,220,130,0.50)",  // green
  "rgba(255,149,0,0.50)",    // orange
  "rgba(120,210,255,0.55)",  // cyan
  "rgba(255,105,180,0.45)",  // pink
  "rgba(180,130,255,0.45)",  // purple
  "rgba(200,255,60,0.50)",   // lime
  "rgba(255,200,100,0.50)",  // peach
];

function canvasWidth(size: number) {
  return MARGIN * 2 + CELL * size;
}

function canvasHeight(size: number) {
  return HEADER_H + CELL * size + FOOTER_H;
}

function drawHighlighterStroke(
  ctx: CanvasRenderingContext2D,
  positions: [number, number][],
  color: string,
  gridTop: number,
) {
  if (positions.length === 0) return;

  const isHorizontal = positions[0][0] === positions[positions.length - 1][0];
  const padding = 4;

  if (isHorizontal) {
    const row = positions[0][0];
    const minCol = Math.min(...positions.map(([, c]) => c));
    const maxCol = Math.max(...positions.map(([, c]) => c));
    const x = MARGIN + minCol * CELL + padding;
    const y = gridTop + row * CELL + padding;
    const w = (maxCol - minCol + 1) * CELL - padding * 2;
    const h = CELL - padding * 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();
  } else {
    const col = positions[0][1];
    const minRow = Math.min(...positions.map(([r]) => r));
    const maxRow = Math.max(...positions.map(([r]) => r));
    const x = MARGIN + col * CELL + padding;
    const y = gridTop + minRow * CELL + padding;
    const w = CELL - padding * 2;
    const h = (maxRow - minRow + 1) * CELL - padding * 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, w / 2);
    ctx.fill();
  }
}

function drawPuzzle(
  ctx: CanvasRenderingContext2D,
  puzzle: PuzzleState,
  title: string,
  showSolution: boolean,
  showHighlights: boolean,
  scale: number,
  hint = "",
) {
  const W = canvasWidth(puzzle.size);
  const H = canvasHeight(puzzle.size);

  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  const primaryColor = "#1a7a6e";
  const borderColor = "#cbd5e1";
  const textColor = "#1e293b";
  const mutedColor = "#64748b";

  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, W, 56);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 22px 'Cairo', 'Arial', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title || "لغز البحث عن الكلمات", W / 2, 28);

  if (showSolution) {
    ctx.fillStyle = "#ffffff99";
    ctx.font = `14px 'Cairo', 'Arial', sans-serif`;
    ctx.fillText("(ورقة الحل)", W / 2, 46);
  }

  const gridTop = HEADER_H - 8;

  for (let r = 0; r < puzzle.size; r++) {
    for (let c = 0; c < puzzle.size; c++) {
      const x = MARGIN + c * CELL;
      const y = gridTop + r * CELL;
      ctx.fillStyle = "#f8fafc";
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, CELL - 4, CELL - 4, 5);
      ctx.fill();
      ctx.stroke();
    }
  }

  if (showHighlights && puzzle.wordPlacements) {
    for (let i = 0; i < puzzle.wordPlacements.length; i++) {
      const color = HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length];
      drawHighlighterStroke(ctx, puzzle.wordPlacements[i].positions, color, gridTop);
    }
  }

  if (showSolution && puzzle.secretPositions.length > 0) {
    const padding = 4;
    for (const [r, c] of puzzle.secretPositions) {
      const x = MARGIN + c * CELL + padding;
      const y = gridTop + r * CELL + padding;
      const sz = CELL - padding * 2;
      ctx.fillStyle = "rgba(255,235,59,0.7)";
      ctx.beginPath();
      ctx.roundRect(x, y, sz, sz, 6);
      ctx.fill();
    }
  }

  for (let r = 0; r < puzzle.size; r++) {
    for (let c = 0; c < puzzle.size; c++) {
      const x = MARGIN + c * CELL;
      const y = gridTop + r * CELL;
      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.round(CELL * 0.44)}px 'Cairo', 'Arial', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(puzzle.grid[r][c], x + CELL / 2, y + CELL / 2);
    }
  }

  if (showSolution && puzzle.secretPositions.length > 0) {
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.5;
    for (const [r, c] of puzzle.secretPositions) {
      const cx = MARGIN + c * CELL + CELL / 2;
      const cy = gridTop + r * CELL + CELL / 2;
      const halfW = CELL * 0.34;
      ctx.beginPath();
      ctx.moveTo(cx - halfW, cy);
      ctx.lineTo(cx + halfW, cy);
      ctx.stroke();
    }
  }

  const footerTop = gridTop + puzzle.size * CELL + 16;

  ctx.textAlign = "right";
  ctx.textBaseline = "top";

  if (showSolution) {
    ctx.fillStyle = primaryColor;
    ctx.font = `bold 16px 'Cairo', 'Arial', sans-serif`;
    ctx.fillText(`كلمة السر هي: ${puzzle.secretWord}`, W - MARGIN, footerTop);
  } else {
    const secretLabel = `كلمة السر: ( ${toArabicNumeral(puzzle.secretWord.length)} أحرف )`;
    const hintText = hint ? `  —  ${hint}` : "";
    ctx.fillStyle = mutedColor;
    ctx.font = `15px 'Cairo', 'Arial', sans-serif`;
    ctx.fillText(secretLabel + hintText, W - MARGIN, footerTop, W - MARGIN * 2);
  }

  const wordLabel = "الكلمات المخفية: ";
  const words = puzzle.usedWords.join(" ، ");
  ctx.fillStyle = primaryColor;
  ctx.font = `bold 13px 'Cairo', 'Arial', sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText(wordLabel + words, W - MARGIN, footerTop + 28, W - MARGIN * 2);
}

export async function buildCanvas(
  puzzle: PuzzleState,
  title: string,
  showSolution: boolean,
  showHighlights: boolean,
  scale = 2,
  hint = "",
): Promise<HTMLCanvasElement> {
  const W = canvasWidth(puzzle.size);
  const H = canvasHeight(puzzle.size);

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;

  await document.fonts.ready;

  drawPuzzle(ctx, puzzle, title, showSolution, showHighlights, scale, hint);

  return canvas;
}

export async function exportPng(
  puzzle: PuzzleState,
  title: string,
  showSolution: boolean,
  showHighlights: boolean,
  filename: string,
  hint = "",
) {
  const canvas = await buildCanvas(puzzle, title, showSolution, showHighlights, 2, hint);
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function exportPdf(
  puzzle: PuzzleState,
  title: string,
  showHighlights: boolean,
  hint = "",
) {
  const puzzleCanvas = await buildCanvas(puzzle, title, false, showHighlights, 2, hint);
  const solutionCanvas = await buildCanvas(puzzle, title, true, true);

  const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();

  const addPage = (canvas: HTMLCanvasElement, addNew = false) => {
    if (addNew) pdf.addPage();
    const ratio = canvas.height / canvas.width;
    const h = pageW * ratio;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageW, h);
  };

  addPage(puzzleCanvas);
  addPage(solutionCanvas, true);

  pdf.save(`لغز-${title.trim().replace(/\s+/g, "-") || "puzzle"}.pdf`);
}
