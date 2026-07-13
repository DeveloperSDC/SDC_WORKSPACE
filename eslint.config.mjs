import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Enforce explicit return types on module-level functions
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // Disallow any
      '@typescript-eslint/no-explicit-any': 'error',
      // Disallow unused vars (warn so CI doesn't break during active development)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // No console.log in production code — use the logger
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Consistent imports
      'import/no-duplicates': 'error',
    },
  },
]

export default eslintConfig
