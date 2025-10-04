// apps/api/src/paths.ts
import * as path from 'path';
import * as fs from 'fs';

/**
 * Spróbuj wykryć root monorepo idąc w górę od __dirname (czyli od katalogu kompilacji, np. dist/src)
 * Szukamy plików-znaczników: pnpm-workspace.yaml lub package.json zawierającego "apps" katalog.
 */
function detectRepoRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    const ws = path.join(dir, 'pnpm-workspace.yaml');
    const pkg = path.join(dir, 'package.json');
    if (fs.existsSync(ws)) return dir;
    if (fs.existsSync(pkg)) {
      // Heurystyka: jeśli na tym poziomie istnieje katalog "apps", traktujemy to jako root
      if (fs.existsSync(path.join(dir, 'apps'))) return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir; // fallback
}

/**
 * Priorytet:
 * 1) Zmienna środowiskowa (na wszelki wypadek / Docker / prod)
 * 2) Automatyczne wykrycie od __dirname (działa zarówno w src/, jak i w dist/)
 * 3) process.cwd() jako ostatnia deska ratunku
 */
const ENV_ROOT = process.env.API_ROOT_DIR && fs.existsSync(process.env.API_ROOT_DIR)
  ? path.resolve(process.env.API_ROOT_DIR)
  : null;

export const ROOT_DIR =
  ENV_ROOT ||
  detectRepoRoot(__dirname) ||
  process.cwd();

/** Docelowy katalog na uploady w root projektu */
export const UPLOAD_DIR = path.join(ROOT_DIR, 'uploads');

/** Publiczna baza URL dla API (np. http://localhost:3001) */
export const PUBLIC_BASE = process.env.API_PUBLIC_URL ?? 'http://localhost:3001';

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}
