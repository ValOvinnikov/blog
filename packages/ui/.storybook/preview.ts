import '../index.css';
import './preview.css';

import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview, ReactRenderer } from '@storybook/react';

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
    // story. Don't redefine viewports or override them per-story — see the
    // `ui-storybook` skill.
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
