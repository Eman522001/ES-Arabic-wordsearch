# ES-Arabic-wordsearch

Arabic word-search ("كلمة السر") puzzle grid generator, moved from Replit.

pnpm workspace:
- `artifacts/puzzle-generator`: the generator web app (grid engine in `src/lib/puzzle-engine.ts`, export in `export-book.ts` / `export-canvas.ts`)
- `artifacts/api-server`, `artifacts/mockup-sandbox`, `lib/*`, `scripts/`: supporting packages

## Run

    pnpm install
    cd artifacts/puzzle-generator
    PORT=5173 BASE_PATH=/ pnpm run dev

`DATABASE_URL` is only needed by the api-server and is read from the environment.
