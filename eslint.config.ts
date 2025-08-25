import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';
import path from 'path';

export default [
  js.configs.recommended, // base JS rules
  ...tseslint.configs.recommended, // TS rules
  prettier, // Prettier integration
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json', // point to your tsconfig
        tsconfigRootDir: path.resolve(), // force ESLint to use correct root
      },
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
