// Weights/styles mirror apps/web/src/config/font-loaders/*.ts's next/font
// loaders — keep both lists in sync when adding or removing one.
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/500.css';
import '@fontsource/newsreader/400-italic.css';
import '@fontsource/newsreader/500-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '../index.css';
import './preview.css';

import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview, ReactRenderer } from '@storybook/react-vite';

const preview: Preview = {
  // Toolbar theme switcher: toggles the `.dark` class on the preview <html>,
  // matching how apps/web applies dark mode. `.dark` flips the theme tokens and
  // preview.css re-asserts the themed canvas background, so light/dark switches
  // the whole preview — background and all.
  decorators: [
    withThemeByClassName<ReactRenderer>({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
    }),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },
    layout: 'centered',
    options: {
      storySort: {
        order: [
          'Design Tokens',
          'Atoms',
          'Molecules',
          'Organisms',
          'Templates',
          '*',
        ],
      },
    },
    // Custom viewport presets matching this repo's Tailwind breakpoints
    // (`sm` 640px, `md` 768px — Tailwind v4 defaults, unmodified by
    // `configs/tailwind/preset.ts`), available from the toolbar for any
    // story. Don't redefine viewports or override them per-story, except the
    // narrow case documented in the `ui-storybook` skill (a component whose
    // rendering forks on a real, non-container media-query breakpoint).
    viewport: {
      viewports: {
        phone: {
          name: 'Phone (<640px)',
          styles: { width: '375px', height: '667px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet (640-768px)',
          styles: { width: '700px', height: '1024px' },
          type: 'tablet',
        },
        desktop: {
          name: 'Desktop (≥768px)',
          styles: { width: '1024px', height: '768px' },
          type: 'desktop',
        },
      },
    },
  },
};
export default preview;
