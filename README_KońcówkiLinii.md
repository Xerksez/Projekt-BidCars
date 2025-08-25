# Fix LF/CRLF (Delete ␍)

Jeśli widzisz błędy typu `Delete ␍`, masz mieszane końcówki linii (CRLF/LF).

## 1) Skonfiguruj repo
- Skopiuj do roota: `.editorconfig`, `.prettierrc`, `.gitattributes` (już masz), `.vscode/settings.json`.
- W Next (`apps/web`) dodaj `.eslintrc.json` z `"linebreak-style": "off"`.
- W Nest (`apps/api`) edytuj `eslint.config.mjs`, dodając `rules: { 'linebreak-style': 'off' }` (plik w paczce).

## 2) Przepisz istniejące pliki na LF
W konsoli w root repo:
```bash
git add --renormalize .
git commit -m "chore: normalize line endings (LF)"
```

## 3) VS Code
- Ustaw `LF` w prawym dolnym rogu edytora (ikonka CRLF/LF).
- Włącz formatowanie Prettier na save (ustawione w `.vscode/settings.json`).

Gotowe — błędy `Delete ␍` znikną.
