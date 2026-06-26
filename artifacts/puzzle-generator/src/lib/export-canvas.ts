import jsPDF from "jspdf";
import type { PuzzleState } from "./puzzle-engine";
import { toArabicNumeral } from "./puzzle-engine";

const CELL = 52;
const MARGIN = 60;
const HEADER_H = 80;
const FOOTER_H = 120;

function canvasWidth(size: number) {
  return MARGIN * 2 + CELL * size;
}

function canvasHeight(size: number) {
  return HEADER_H + CELL * size + FOOTER_H;
}

function drawPuzzle(
  ctx: CanvasRenderingContext2D,
  puzzle: PuzzleState,
  title: string,
  showSolution: boolean,
  scale: number,
) {
  const W = canvasWidth(puzzle.size);
  const H = canvasHeight(puzzle.size);

  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  const primaryColor = "#1a7a6e";
  const highlightColor = "#fef08a";
  const borderColor = "#cbd5e1";
  const textColor = "#1e293b";
  const mutedColor = "#64748b";

  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, W, 56);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${22 * scale > 24 ? 22 : 22}px 'Cairo', 'Arial', sans-serif`;
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

      const isSecret =
        showSolution &&
        puzzle.secretPositions.some(([pr, pc]) => pr === r && pc === c);

      ctx.fillStyle = isSecret ? highlightColor : "#f8fafc";
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, CELL - 4, CELL - 4, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.round(CELL * 0.44)}px 'Cairo', 'Arial', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(puzzle.grid[r][c], x + CELL / 2, y + CELL / 2);
    }
  }

  const footerTop = gridTop + puzzle.size * CELL + 16;

  ctx.fillStyle = mutedColor;
  ctx.font = `15px 'Cairo', 'Arial', sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(
    `كلمة السر: ( ${toArabicNumeral(puzzle.secretWord.length)} أحرف )`,
    W - MARGIN,
    footerTop,
  );

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
  scale = 2,
): Promise<HTMLCanvasElement> {
  const W = canvasWidth(puzzle.size);
  const H = canvasHeight(puzzle.size);

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;

  await document.fonts.ready;

  drawPuzzle(ctx, puzzle, title, showSolution, scale);

  return canvas;
}

export async function exportPng(
  puzzle: PuzzleState,
  title: string,
  showSolution: boolean,
  filename: string,
) {
  const canvas = await buildCanvas(puzzle, title, showSolution);
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function exportPdf(puzzle: PuzzleState, title: string) {
  const puzzleCanvas = await buildCanvas(puzzle, title, false);
  const solutionCanvas = await buildCanvas(puzzle, title, true);

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
