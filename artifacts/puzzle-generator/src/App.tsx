import { useState } from "react";
import { generatePuzzle, toArabicNumeral, type PuzzleState } from "@/lib/puzzle-engine";
import { exportPng, exportPdf, HIGHLIGHT_COLORS } from "@/lib/export-canvas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileDown, ImageDown, ArrowRight, Grid3X3, BookOpen, KeyRound } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

function buildCellColorMap(puzzle: PuzzleState): Map<string, string> {
  const map = new Map<string, string>();
  if (!puzzle.wordPlacements) return map;
  puzzle.wordPlacements.forEach((wp, i) => {
    const color = HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length];
    for (const [r, c] of wp.positions) {
      map.set(`${r}-${c}`, color);
    }
  });
  return map;
}

function App() {
  const [gameState, setGameState] = useState<{
    formValues: { size: number; title: string; words: string; secretWord: string; hint: string };
    puzzle: PuzzleState | null;
    showSolution: boolean;
  }>({
    formValues: {
      size: 8,
      title: "الحيوانات",
      words: "أسد، نمر، فيل، زرافة، قرد، غزال، دب",
      secretWord: "حيوان",
      hint: "",
    },
    puzzle: null,
    showSolution: false,
  });

  const handleGenerate = () => {
    const { size, words, secretWord } = gameState.formValues;
    const wordsList = words.split(/[,،]/).map(w => w.trim()).filter(w => w.length > 0);
    if (wordsList.length === 0 || secretWord.trim().length === 0) {
      alert("يرجى إدخال كلمات وكلمة سر صالحة");
      return;
    }
    const puzzle = generatePuzzle(size, wordsList, secretWord.trim());
    setGameState(prev => ({ ...prev, puzzle, showSolution: false }));
  };

  const handleBack = () => {
    setGameState(prev => ({ ...prev, puzzle: null }));
  };

  const isSecretPos = (r: number, c: number) =>
    gameState.puzzle!.secretPositions.some(([pr, pc]) => pr === r && pc === c);

  const renderGrid = () => {
    const puzzle = gameState.puzzle!;
    const cellColors = buildCellColorMap(puzzle);

    return (
      <div
        className="grid gap-1 mb-6 select-none"
        style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}
      >
        {puzzle.grid.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r}-${c}`;
            const highlightColor = gameState.showSolution ? cellColors.get(key) : undefined;
            const isSecret = gameState.showSolution && isSecretPos(r, c);

            return (
              <div
                key={key}
                className="aspect-square flex items-center justify-center text-xl font-bold rounded-md border border-border/60 transition-all duration-200"
                style={{
                  backgroundColor: isSecret
                    ? "rgba(180,180,180,0.55)"
                    : highlightColor
                    ? highlightColor
                    : undefined,
                  boxShadow: highlightColor && !isSecret
                    ? `inset 0 0 0 2px ${highlightColor.replace(/[\d.]+\)$/, "0.8)")}`
                    : undefined,
                }}
                data-testid={`cell-${r}-${c}`}
              >
                <span style={{ textDecoration: isSecret ? "line-through" : "none", textDecorationThickness: "1.5px", textDecorationColor: "#64748b" }}>
                  {cell}
                </span>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderPrintableView = () => {
    const puzzle = gameState.puzzle!;
    return (
      <div className="bg-white p-8 rounded-xl" style={{ maxWidth: "100%", margin: "0 auto" }} dir="rtl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-primary mb-1">
            {gameState.formValues.title || "لغز البحث عن الكلمات"}
          </h2>
          {gameState.showSolution && (
            <>
              <p className="text-base text-muted-foreground">(ورقة الحل)</p>
              <p className="mt-2 text-lg font-bold text-primary">
                كلمة السر هي: <span className="text-foreground">{puzzle.secretWord}</span>
              </p>
            </>
          )}
        </div>

        <div className="max-w-[520px] mx-auto">
          {renderGrid()}
        </div>

        <div className="mt-6 bg-muted/30 p-5 rounded-lg border border-border space-y-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary shrink-0" />
              <h3 className="font-bold text-foreground">
                كلمة السر: ({toArabicNumeral(puzzle.secretWord.length)} أحرف)
              </h3>
            </div>
            {!gameState.showSolution && gameState.formValues.hint && (
              <span className="text-muted-foreground text-sm italic">
                — {gameState.formValues.hint}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-primary shrink-0" />
              <h3 className="font-bold text-foreground">الكلمات المستخدمة:</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {puzzle.usedWords.map((word, i) => (
                <span
                  key={i}
                  className="px-3 py-1 border border-border rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: gameState.showSolution
                      ? HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length].replace(/[\d.]+\)$/, "0.35)")
                      : undefined,
                  }}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const title = gameState.formValues.title;

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-foreground" dir="rtl">
      <header className="bg-primary text-primary-foreground py-5 shadow-md">
        <div className="container mx-auto px-4 flex items-center justify-center gap-3">
          <Grid3X3 className="w-7 h-7" />
          <h1 className="text-2xl font-bold">صانع الألغاز العربية</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!gameState.puzzle ? (
          <Card className="border-border/50 shadow-lg animate-in fade-in zoom-in-95 duration-300">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl text-primary">إعداد اللغز</CardTitle>
              <CardDescription className="text-base">قم بإدخال الكلمات وكلمة السر لإنشاء لغز جديد</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 mt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-semibold">عنوان الموضوع</Label>
                  <Input
                    id="title"
                    value={gameState.formValues.title}
                    onChange={e => setGameState(prev => ({ ...prev, formValues: { ...prev.formValues, title: e.target.value } }))}
                    placeholder="مثال: الحيوانات الأليفة"
                    className="h-12 text-lg"
                    data-testid="input-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size" className="text-base font-semibold">حجم الشبكة</Label>
                  <Select
                    value={gameState.formValues.size.toString()}
                    onValueChange={v => setGameState(prev => ({ ...prev, formValues: { ...prev.formValues, size: parseInt(v) } }))}
                  >
                    <SelectTrigger id="size" className="h-12 text-lg" data-testid="select-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 19 }, (_, i) => i + 2).map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} × {n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="words" className="text-base font-semibold">الكلمات (مفصولة بفاصلة)</Label>
                <Textarea
                  id="words"
                  value={gameState.formValues.words}
                  onChange={e => setGameState(prev => ({ ...prev, formValues: { ...prev.formValues, words: e.target.value } }))}
                  placeholder="أدخل الكلمات هنا..."
                  className="min-h-[120px] text-lg resize-y"
                  data-testid="textarea-words"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="secret" className="text-base font-semibold">كلمة السر (مخفية في الخلايا الفارغة)</Label>
                  <Input
                    id="secret"
                    value={gameState.formValues.secretWord}
                    onChange={e => setGameState(prev => ({ ...prev, formValues: { ...prev.formValues, secretWord: e.target.value } }))}
                    placeholder="أدخل كلمة السر..."
                    className="h-12 text-lg"
                    data-testid="input-secret"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hint" className="text-base font-semibold">لمحة عن كلمة السر <span className="text-muted-foreground font-normal text-sm">(اختياري)</span></Label>
                  <Input
                    id="hint"
                    value={gameState.formValues.hint}
                    onChange={e => setGameState(prev => ({ ...prev, formValues: { ...prev.formValues, hint: e.target.value } }))}
                    placeholder="مثال: هي أكبر الحيوانات البرية"
                    className="h-12 text-lg"
                    data-testid="input-hint"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 pb-8 flex justify-center">
              <Button
                size="lg"
                className="w-full md:w-auto px-12 h-14 text-lg font-bold shadow-md hover:-translate-y-1 transition-transform"
                onClick={handleGenerate}
                data-testid="button-generate"
              >
                إنشاء اللغز
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="space-y-5 animate-in slide-in-from-bottom-8 duration-500">

            <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-xl shadow-sm border border-border">
              <Button variant="outline" onClick={handleBack} className="font-semibold gap-2" data-testid="button-back">
                <ArrowRight className="w-4 h-4" />
                لغز جديد
              </Button>

              <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
                <Label htmlFor="show-solution" className="font-semibold cursor-pointer select-none text-sm">إظهار الحل والتظليل</Label>
                <Switch
                  id="show-solution"
                  checked={gameState.showSolution}
                  onCheckedChange={v => setGameState(prev => ({ ...prev, showSolution: v }))}
                  data-testid="switch-solution"
                />
              </div>
            </div>

            {gameState.puzzle.unusedWords.length > 0 && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                <AlertTitle className="font-bold mb-1">تنبيه: لم تتسع بعض الكلمات في الشبكة</AlertTitle>
                <AlertDescription className="font-medium">
                  الكلمات التالية لم يتم إضافتها: {gameState.puzzle.unusedWords.join("، ")}
                </AlertDescription>
              </Alert>
            )}

            <div className="border-2 border-border rounded-2xl overflow-hidden bg-white shadow-lg">
              {renderPrintableView()}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 font-bold h-13"
                onClick={() => exportPng(gameState.puzzle!, title, false, false, `لغز-${title.trim().replace(/\s+/g, "-")}.png`, gameState.formValues.hint)}
                data-testid="button-export-png"
              >
                <ImageDown className="w-5 h-5" />
                تحميل اللغز PNG
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 font-bold h-13"
                onClick={() => exportPng(gameState.puzzle!, title, true, true, `حل-${title.trim().replace(/\s+/g, "-")}.png`)}
                data-testid="button-export-solution-png"
              >
                <ImageDown className="w-5 h-5" />
                تحميل الحل PNG
              </Button>
              <Button
                size="lg"
                className="gap-2 font-bold h-13"
                onClick={() => exportPdf(gameState.puzzle!, title, false, gameState.formValues.hint)}
                data-testid="button-export-pdf"
              >
                <FileDown className="w-5 h-5" />
                تحميل PDF (لغز + حل)
              </Button>
            </div>

          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}

export default App;
