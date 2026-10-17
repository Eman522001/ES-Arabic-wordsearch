import type { PuzzleState } from "./puzzle-engine";
import { toArabicNumeral } from "./puzzle-engine";

const PAGE_W = 595;
const PAGE_H = 842;

// ─── Text Utilities ────────────────────────────────────────────────────────────

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  // Split Arabic text by spaces
  const tokens = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const token of tokens) {
    const test = current ? current + " " + token : token;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = token;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Draws wrapped text and returns the Y after the last line */
function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineH: number,
): number {
  const lines = wrapTextLines(ctx, text, maxWidth);
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lineH;
  }
  return y;
}

// ─── Shared Helpers ────────────────────────────────────────────────────────────

function drawImagePlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.fillStyle = "#f1f5f9";
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  // Cross marks to indicate empty image frame
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 4);
  ctx.lineTo(x + w - 4, y + h - 4);
  ctx.moveTo(x + w - 4, y + 4);
  ctx.lineTo(x + 4, y + h - 4);
  ctx.stroke();
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const cropW = w / scale;
  const cropH = h / scale;
  const cropX = (image.naturalWidth - cropW) / 2;
  const cropY = (image.naturalHeight - cropH) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.clip();
  ctx.drawImage(image, cropX, cropY, cropW, cropH, x, y, w, h);
  ctx.restore();

  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.stroke();
}

async function loadImage(dataUrl?: string): Promise<HTMLImageElement | null> {
  if (!dataUrl) return null;

  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  return image;
}

// ─── ADULTS DESIGN ────────────────────────────────────────────────────────────

function drawAdultsPage(
  ctx: CanvasRenderingContext2D,
  puzzle: PuzzleState,
  title: string,
  hint: string,
  pageNum: number,
  image: HTMLImageElement | null,
) {
  const W = PAGE_W;
  const H = PAGE_H;
  const PAD = 18; // page inner padding

  // ── Marble background ──
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#f5b8c8");
  bg.addColorStop(0.3, "#e8cef8");
  bg.addColorStop(0.6, "#c0d8f5");
  bg.addColorStop(1, "#f0b5c8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── White page ──
  ctx.fillStyle = "rgba(255,255,255,0.93)";
  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(PAD, PAD, W - PAD * 2, H - PAD * 2, 10);
  ctx.fill();
  ctx.stroke();

  // ── Page number (top right, inside white area) ──
  ctx.fillStyle = "#d97706";
  ctx.font = `bold 22px 'Cairo', Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(toArabicNumeral(pageNum), W - PAD - 10, PAD + 10);

  // ── Title box ──
  const titleBoxW = 260;
  const titleBoxH = 48;
  const titleBoxX = (W - titleBoxW) / 2;
  const titleBoxY = PAD + 14;
  ctx.fillStyle = "#fef9c3";
  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(titleBoxX, titleBoxY, titleBoxW, titleBoxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#0d9488";
  ctx.font = `bold 24px 'Cairo', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, W / 2, titleBoxY + titleBoxH / 2);

  // ── "الكلمات" heading ──
  let curY = titleBoxY + titleBoxH + 14;
  ctx.fillStyle = "#0d9488";
  ctx.font = `bold 19px 'Cairo', Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("الكلمات", W - PAD - 12, curY);
  curY += 26;

  // ── Words list ──
  const wordsText = puzzle.usedWords.join(" - ");
  ctx.fillStyle = "#1e293b";
  ctx.font = `14px 'Cairo', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const maxWordW = W - PAD * 2 - 24;
  curY = drawWrapped(ctx, wordsText, W / 2, curY, maxWordW, 20);
  curY += 10;

  // ── Grid ──
  const cellSize = Math.min(44, Math.floor((W - PAD * 2 - 30) / puzzle.size));
  const gridTotalW = cellSize * puzzle.size;
  const gridX = (W - gridTotalW) / 2;
  const gridY = curY;

  for (let r = 0; r < puzzle.size; r++) {
    for (let c = 0; c < puzzle.size; c++) {
      const x = gridX + c * cellSize;
      const y = gridY + r * cellSize;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#7c3aed";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(x + 1, y + 1, cellSize - 2, cellSize - 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#0d9488";
      ctx.font = `bold ${Math.round(cellSize * 0.42)}px 'Cairo', Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(puzzle.grid[r][c], x + cellSize / 2, y + cellSize / 2);
    }
  }

  // ── Footer area ──
  const footerY = gridY + puzzle.size * cellSize + 16;
  const stripH = 30;
  const stripY = H - PAD - stripH - 6;

  // Image placeholder (left side)
  const imgW = 130;
  const imgH = Math.min(100, stripY - footerY - 8);
  if (image) {
    drawPhoto(ctx, image, PAD + 12, footerY, imgW, imgH);
  } else {
    drawImagePlaceholder(ctx, PAD + 12, footerY, imgW, imgH);
  }

  // "كلمة السر" heading
  const rightX = W - PAD - 12;
  ctx.fillStyle = "#0d9488";
  ctx.font = `bold 26px 'Cairo', Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("كلمة السر", rightX, footerY + 4);

  // Count
  ctx.fillStyle = "#475569";
  ctx.font = `13px 'Cairo', Arial, sans-serif`;
  ctx.fillText(`( ${toArabicNumeral(puzzle.secretWord.length)} أحرف )`, rightX, footerY + 38);

  // Hint text
  if (hint) {
    ctx.fillStyle = "#1e293b";
    ctx.font = `13px 'Cairo', Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    const hintMaxW = rightX - (PAD + 12 + imgW + 12);
    drawWrapped(ctx, hint, rightX, footerY + 58, hintMaxW, 18);
  }

  // ── Bottom strip "هل عرفتها؟" ──
  ctx.fillStyle = "#99f6e4";
  ctx.beginPath();
  ctx.roundRect(PAD + 4, stripY, W - PAD * 2 - 8, stripH, 6);
  ctx.fill();

  ctx.fillStyle = "#0f766e";
  ctx.font = `bold 13px 'Cairo', Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("هل عرفتها؟  ...............................  ", W - PAD - 16, stripY + stripH / 2);
}

export async function exportBookAdults(
  puzzle: PuzzleState,
  title: string,
  hint: string,
  pageNum: number,
  filename: string,
  imageDataUrl?: string,
) {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_W * 2;
  canvas.height = PAGE_H * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);
  await document.fonts.ready;
  const image = await loadImage(imageDataUrl);
  drawAdultsPage(ctx, puzzle, title, hint, pageNum, image);
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// ─── KIDS DESIGN ──────────────────────────────────────────────────────────────

function drawColorfulBorder(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const borderW = 9;
  const segLen = 22;
  const gap = 4;
  const colors = [
    "#f59e0b", "#10b981", "#8b5cf6", "#ef4444",
    "#3b82f6", "#ec4899", "#f97316", "#6366f1",
    "#14b8a6", "#84cc16",
  ];
  let ci = 0;
  const nc = () => { const c = colors[ci % colors.length]; ci++; return c; };

  // Top
  for (let x = 0; x < W; x += segLen + gap) {
    ctx.fillStyle = nc();
    ctx.fillRect(x, 0, Math.min(segLen, W - x), borderW);
  }
  // Bottom
  for (let x = 0; x < W; x += segLen + gap) {
    ctx.fillStyle = nc();
    ctx.fillRect(x, H - borderW, Math.min(segLen, W - x), borderW);
  }
  // Left
  for (let y = borderW; y < H - borderW; y += segLen + gap) {
    ctx.fillStyle = nc();
    ctx.fillRect(0, y, borderW, Math.min(segLen, H - borderW - y));
  }
  // Right
  for (let y = borderW; y < H - borderW; y += segLen + gap) {
    ctx.fillStyle = nc();
    ctx.fillRect(W - borderW, y, borderW, Math.min(segLen, H - borderW - y));
  }
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.translate(cx, cy + r * 0.2);
  ctx.beginPath();
  ctx.moveTo(0, r * 0.4);
  ctx.bezierCurveTo(-r * 0.1, -r * 0.2, -r * 1.1, -r * 0.2, -r * 1.1, r * 0.35);
  ctx.bezierCurveTo(-r * 1.1, r * 0.85, 0, r * 1.1, 0, r * 1.1);
  ctx.bezierCurveTo(0, r * 1.1, r * 1.1, r * 0.85, r * 1.1, r * 0.35);
  ctx.bezierCurveTo(r * 1.1, -r * 0.2, r * 0.1, -r * 0.2, 0, r * 0.4);
  ctx.fill();
  ctx.restore();
}

function drawBow(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx, cy);
  // Left wing
  ctx.beginPath();
  ctx.ellipse(-size * 0.55, 0, size * 0.65, size * 0.42, -0.25, 0, Math.PI * 2);
  ctx.fill();
  // Right wing
  ctx.beginPath();
  ctx.ellipse(size * 0.55, 0, size * 0.65, size * 0.42, 0.25, 0, Math.PI * 2);
  ctx.fill();
  // Center knot
  const prevFill = ctx.fillStyle;
  ctx.fillStyle = "#fbcfe8";
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.28, size * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = prevFill;
  ctx.restore();
}

function drawSimpleCar(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx - size, cy - size * 0.45);
  // Body
  ctx.fillRect(0, size * 0.35, size * 2, size * 0.65);
  // Cabin
  ctx.beginPath();
  ctx.roundRect(size * 0.32, 0, size * 1.2, size * 0.55, 4);
  ctx.fill();
  // Wheels
  const prevFill = ctx.fillStyle;
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.arc(size * 0.42, size * 1.06, size * 0.27, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size * 1.58, size * 1.06, size * 0.27, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = prevFill;
  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  // Main circle
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Stripe
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = r * 0.3;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r * 0.3);
  ctx.quadraticCurveTo(cx, cy - r * 0.6, cx + r, cy - r * 0.3);
  ctx.stroke();
  ctx.restore();
}

function drawCloudBox(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  fill: string,
  stroke: string,
) {
  // Main pill body
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.stroke();

  // Top bumps
  const bumpData = [
    { ox: -w * 0.28, r: h * 0.38 },
    { ox: 0, r: h * 0.44 },
    { ox: w * 0.28, r: h * 0.36 },
  ];
  // Fill bumps first
  ctx.fillStyle = fill;
  for (const b of bumpData) {
    ctx.beginPath();
    ctx.arc(cx + b.ox, cy - h / 2 + b.r * 0.45, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Stroke bumps
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  for (const b of bumpData) {
    ctx.beginPath();
    ctx.arc(cx + b.ox, cy - h / 2 + b.r * 0.45, b.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Cover the bottom half of bumps with fill to merge with body
  ctx.fillStyle = fill;
  ctx.fillRect(cx - w / 2 - 2, cy - h / 2 - 2, w + 4, h / 2 + 4);
  // Redraw body outline top edge
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.stroke();
}

function drawKidsPage(
  ctx: CanvasRenderingContext2D,
  puzzle: PuzzleState,
  title: string,
  hint: string,
  pageNum: number,
  variant: "pink" | "blue",
  image: HTMLImageElement | null,
) {
  const W = PAGE_W;
  const H = PAGE_H;
  const BORD = 10; // border strip width

  const isPink = variant === "pink";
  const cellFill = isPink ? "#f9a8d4" : "#bfdbfe";
  const accentColor = isPink ? "#db2777" : "#2563eb";
  const secretCellFill = "#fde047";
  const secretLetterColor = "#dc2626";

  // ── White background ──
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // ── Colorful border ──
  drawColorfulBorder(ctx, W, H);

  // ── Corner decorations ──
  // Top-left: ball
  ctx.fillStyle = "#3b82f6";
  drawBall(ctx, BORD + 20, BORD + 20, 13);

  // Top-right: heart
  ctx.fillStyle = "#ef4444";
  drawHeart(ctx, W - BORD - 20, BORD + 8, 11);

  // Bottom-left: bow
  ctx.fillStyle = isPink ? "#db2777" : "#7c3aed";
  drawBow(ctx, BORD + 20, H - BORD - 20, 13);

  // Bottom-right: car
  ctx.fillStyle = "#16a34a";
  drawSimpleCar(ctx, W - BORD - 20, H - BORD - 18, 16);

  // ── Cloud title box ──
  const cloudCX = W / 2;
  const cloudCY = 82;
  const cloudW = 200;
  const cloudH = 44;
  drawCloudBox(ctx, cloudCX, cloudCY + 10, cloudW, cloudH, cellFill, accentColor);

  ctx.fillStyle = "#1e1b4b";
  ctx.font = `bold 21px 'Cairo', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, cloudCX, cloudCY + 14);

  // ── "الكلمات" heading ──
  let curY = cloudCY + cloudH / 2 + 28;
  ctx.fillStyle = accentColor;
  ctx.font = `bold 19px 'Cairo', Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("الكلمات", W - BORD - 14, curY);
  curY += 26;

  // ── Words list ──
  const wordsText = puzzle.usedWords.join(" - ");
  ctx.fillStyle = "#1e293b";
  ctx.font = `14px 'Cairo', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const maxWordW = W - BORD * 2 - 28;
  curY = drawWrapped(ctx, wordsText, W / 2, curY, maxWordW, 20);
  curY += 12;

  // ── Grid ──
  const maxCellFromWidth = Math.floor((W - BORD * 2 - 28) / puzzle.size);
  const cellSize = Math.min(52, maxCellFromWidth);
  const gridTotalW = cellSize * puzzle.size;
  const gridX = (W - gridTotalW) / 2;
  const gridY = curY;

  const secretSet = new Set(puzzle.secretPositions.map(([r, c]) => `${r}-${c}`));

  for (let r = 0; r < puzzle.size; r++) {
    for (let c = 0; c < puzzle.size; c++) {
      const x = gridX + c * cellSize;
      const y = gridY + r * cellSize;
      const isSecret = secretSet.has(`${r}-${c}`);

      ctx.fillStyle = isSecret ? secretCellFill : cellFill;
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isSecret ? secretLetterColor : "#1e1b4b";
      ctx.font = `bold ${Math.round(cellSize * 0.42)}px 'Cairo', Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(puzzle.grid[r][c], x + cellSize / 2, y + cellSize / 2);
    }
  }

  // ── Footer ──
  const footerY = gridY + puzzle.size * cellSize + 14;

  // Image placeholder (left)
  const imgSize = 80;
  const imgX = BORD + 14;
  if (image) {
    drawPhoto(ctx, image, imgX, footerY, imgSize, imgSize);
  } else {
    drawImagePlaceholder(ctx, imgX, footerY, imgSize, imgSize);
  }

  // "كلمة السر"
  const rightX = W - BORD - 14;
  ctx.fillStyle = accentColor;
  ctx.font = `bold 24px 'Cairo', Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("كلمة السر", rightX, footerY + 4);

  // Count
  ctx.fillStyle = "#475569";
  ctx.font = `13px 'Cairo', Arial, sans-serif`;
  ctx.fillText(`( ${toArabicNumeral(puzzle.secretWord.length)} أحرف )`, rightX, footerY + 34);

  // Hint
  if (hint) {
    ctx.fillStyle = "#1e293b";
    ctx.font = `13px 'Cairo', Arial, sans-serif`;
    const hintMaxW = rightX - (imgX + imgSize + 12);
    drawWrapped(ctx, hint, rightX, footerY + 54, hintMaxW, 18);
  }

  // Page number circle (bottom left)
  const circleX = BORD + 28;
  const circleY = H - BORD - 28;
  ctx.fillStyle = "#3b82f6";
  ctx.beginPath();
  ctx.arc(circleX, circleY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 15px 'Cairo', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(toArabicNumeral(pageNum), circleX, circleY);
}

export async function exportBookKids(
  puzzle: PuzzleState,
  title: string,
  hint: string,
  pageNum: number,
  variant: "pink" | "blue",
  filename: string,
  imageDataUrl?: string,
) {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_W * 2;
  canvas.height = PAGE_H * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);
  await document.fonts.ready;
  const image = await loadImage(imageDataUrl);
  drawKidsPage(ctx, puzzle, title, hint, pageNum, variant, image);
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
