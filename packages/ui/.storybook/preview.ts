import '../index.css';

import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview, ReactRenderer } from '@storybook/react';

const preview: Preview = {
  // Toolbar theme switcher: toggles the `.dark` class on the preview <html>,
  // matching how apps/web applies dark mode. The shared theme.css paints
  // `html { background: var(--bg) }`, so the whole canvas themes automatically.
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
  },
};
export default preview;
