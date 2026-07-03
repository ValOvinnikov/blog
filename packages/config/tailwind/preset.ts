import type { Config } from 'tailwindcss';

// Legacy Tailwind v3 preset — kept for reference.
// Tailwind v4 projects use tailwind/theme.css + @theme inline instead.
const preset: Omit<Config, 'content'> = {
  theme: {
    extend: {},
  },
};

export default preset;
