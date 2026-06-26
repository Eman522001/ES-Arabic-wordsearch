import { useState } from "react";
import { generatePuzzle, toArabicNumeral, type PuzzleState } from "@/lib/puzzle-engine";
import { exportPng, exportPdf } from "@/lib/export-canvas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, FileDown, ImageDown, ArrowRight, Grid3X3, BookOpen, KeyRound } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

function App() {
  const [gameState, setGameState] = useState<{
    formValues: { size: number; title: string; words: string; secretWord: string };
    puzzle: PuzzleState | null;
    showSolution: boolean;
  }>({
    formValues: {
      size: 8,
      title: "الحيوانات",
      words: "أسد، نمر، فيل، زرافة، قرد، غزال، دب",
      secretWord: "حيوان",
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


  const isSecretPosition = (r: number, c: number, puzzle: PuzzleState) => {
    return puzzle.secretPositions.some(([pr, pc]) => pr === r && pc === c);
  };

  const renderGrid = (puzzle: PuzzleState, isSolution: boolean) => (
    <div 
      className="grid gap-1 mb-6" 
      style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}
    >
      {puzzle.grid.map((row, r) =>
        row.map((cell, c) => {
          const highlight = isSolution && isSecretPosition(r, c, puzzle);
          return (
            <div
              key={`${r}-${c}`}
              className={`
                aspect-square flex items-center justify-center 
                text-2xl font-bold rounded-md border-2 border-primary/20
                ${highlight ? 'bg-secondary text-secondary-foreground border-secondary shadow-sm' : 'bg-card text-card-foreground'}
              `}
            >
              {cell}
            </div>
          );
        })
      )}
    </div>
  );

  const renderPrintableView = (puzzle: PuzzleState, isSolution: boolean) => (
    <div 
      className="bg-white p-8 rounded-xl"
      style={{ width: '800px', maxWidth: '100%', margin: '0 auto' }}
      dir="rtl"
    >
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-primary mb-2">
          {gameState.formValues.title || 'لغز البحث عن الكلمات'}
        </h2>
        {isSolution && <p className="text-xl text-muted-foreground">(ورقة الحل)</p>}
      </div>

      <div className="max-w-[500px] mx-auto">
        {renderGrid(puzzle, isSolution)}
      </div>

      <div className="mt-8 bg-muted/30 p-6 rounded-lg border border-border">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold text-foreground">كلمة السر: ({toArabicNumeral(puzzle.secretWord.length)} أحرف)</h3>
        </div>
        
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold text-foreground">الكلمات المستخدمة:</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {puzzle.usedWords.map((word, i) => (
              <span key={i} className="px-4 py-2 bg-white border border-border rounded-full text-lg font-medium shadow-sm">
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-foreground selection:bg-primary/20 selection:text-primary" dir="rtl">
      <header className="bg-primary text-primary-foreground py-6 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay"></div>
        <div className="container mx-auto px-4 relative z-10 flex items-center justify-center gap-3">
          <Grid3X3 className="w-8 h-8" />
          <h1 className="text-3xl font-bold">صانع الألغاز العربية</h1>
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
                      <SelectItem value="8">8 × 8</SelectItem>
                      <SelectItem value="10">10 × 10</SelectItem>
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
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl shadow-sm border border-border">
              <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto font-semibold gap-2" data-testid="button-back">
                <ArrowRight className="w-4 h-4" />
                لغز جديد
              </Button>

              <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-lg">
                <Label htmlFor="show-solution" className="font-bold cursor-pointer select-none">إظهار الحل</Label>
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
                <AlertTitle className="font-bold text-lg mb-1">تنبيه: لم تتسع بعض الكلمات في الشبكة</AlertTitle>
                <AlertDescription className="text-base font-medium">
                  الكلمات التالية لم يتم إضافتها لأن الشبكة صغيرة: {gameState.puzzle.unusedWords.join('، ')}
                </AlertDescription>
              </Alert>
            )}

            <div className="relative border-4 border-border rounded-2xl overflow-hidden bg-muted/10 shadow-lg">
              {renderPrintableView(gameState.puzzle, gameState.showSolution)}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 font-bold shadow-sm h-14"
                onClick={() => exportPng(gameState.puzzle!, gameState.formValues.title, false, `لغز-${gameState.formValues.title.trim().replace(/\s+/g, '-')}.png`)}
                data-testid="button-export-png"
              >
                <ImageDown className="w-5 h-5" />
                تحميل PNG
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 font-bold shadow-sm h-14"
                onClick={() => exportPng(gameState.puzzle!, gameState.formValues.title, true, `حل-لغز-${gameState.formValues.title.trim().replace(/\s+/g, '-')}.png`)}
                data-testid="button-export-solution-png"
              >
                <ImageDown className="w-5 h-5 text-secondary-foreground" />
                تحميل الحل PNG
              </Button>
              <Button
                size="lg"
                className="gap-2 font-bold shadow-md h-14"
                onClick={() => exportPdf(gameState.puzzle!, gameState.formValues.title)}
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
