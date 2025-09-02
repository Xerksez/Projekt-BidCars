// apps/api/src/paths.ts
import * as path from 'path';
import * as fs from 'fs';

/**
 * 1) Jeśli ustawisz absolutne UPLOADS_DIR w env – użyjemy go wprost.
 * 2) W przeciwnym razie spróbujemy znaleźć root repo (pnpm-workspace.yaml
 *    albo package.json z polem "workspaces") idąc w górę katalogów.
 * 3) Domyślnie: <ROOT>/uploads
 */

function findRepoRoot(startDir: string): string {
  let dir = startDir;
  // maksymalnie 10 poziomów w górę (bez paranoi)
  for (let i = 0; i < 10; i++) {
    const ws = path.join(dir, 'pnpm-workspace.yaml');
    const pkg = path.join(dir, 'package.json');

    if (fs.existsSync(ws)) return dir;

    if (fs.existsSync(pkg)) {
      try {
        const json = JSON.parse(fs.readFileSync(pkg, 'utf8'));
        if (json && (json.workspaces || json?.pnpm?.packages)) return dir;
      } catch { /* ignore */ }
    }

    const parent = path.dirname(dir);
    if (parent === dir) break; // dotarliśmy do dysku
    dir = parent;
  }
  return startDir; // fallback
}

// 1) Priorytet: absolutna ścieżka z ENV (np. w Dockerze)
const envUploads = process.env.UPLOADS_DIR;
export const UPLOAD_DIR = envUploads && path.isAbsolute(envUploads)
  ? envUploads
  : path.join(
      // 2) Spróbujmy wykryć root repo względem CWD (gdziekolwiek uruchamiasz)
      findRepoRoot(process.cwd()),
      'uploads',
    );

// Publiczna baza URL do budowania absolutnych linków do plików
export const PUBLIC_BASE = process.env.API_PUBLIC_URL ?? 'http://localhost:3001';

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  return UPLOAD_DIR;
}
