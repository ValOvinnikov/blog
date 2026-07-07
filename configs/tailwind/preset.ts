import type { Config } from 'tailwindcss';

// Legacy Tailwind v3 preset entrypoint, kept for consumers that still expect a
// JavaScript config object. Tailwind v4 projects should import theme.css.
const preset: Omit<Config, 'content'> = {
  theme: {
    extend: {},
  },
};

export default preset;
