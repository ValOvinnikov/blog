import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { version as reactVersion } from 'react';

import base from './base.js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { react },
    rules: {
      ...react.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    // Pin to the installed React version instead of `settings.react.version:
    // 'detect'` — eslint-plugin-react's own detection routine calls a
    // removed ESLint context API and crashes under ESLint 10.
    settings: { react: { version: reactVersion } },
  },
  reactHooks.configs.flat.recommended,
];
