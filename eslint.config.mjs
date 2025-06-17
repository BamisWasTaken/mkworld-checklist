import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      'no-unused-vars': 'off'
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**', '.angular/**']
  }
);
