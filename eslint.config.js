import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['**/node_modules/**', '.claude/**', 'guide/**', 'plans/**', 'coverage/**'] },
  js.configs.recommended,
  {
    files: ['backend/**/*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['frontend/**/*.js'],
    languageOptions: { globals: { ...globals.browser, confetti: 'readonly' } },
  },
  {
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_|^(req|res|next)$' }],
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  prettier, // tắt các rule về định dạng — để Prettier lo
];
