import type { Config } from "tailwindcss";

// Shared design tokens for @blog/ui and web. The CSS custom properties these
// reference live in packages/ui/src/styles/tokens.css and are imported by the
// web app's global stylesheet, so both layers render identical tokens.
const preset: Omit<Config, "content"> = {
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        fg: "var(--color-fg)",
        muted: "var(--color-muted)",
        accent: "var(--color-accent)",
        border: "var(--color-border)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
};

export default preset;
