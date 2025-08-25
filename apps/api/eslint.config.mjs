// apps/api/eslint.config.mjs — dodaj/zmień rules: { 'linebreak-style': 'off' }
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.{ts,tsx,js}'],
    rules: {
      'linebreak-style': 'off'
    }
  }
];
