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
import './preview.css';

import { SKINS_WITH_STORYBOOK } from '@shinefold/config';
import { withThemeByClassName } from '@storybook/addon-themes';
import type { Decorator, Preview, ReactRenderer } from '@storybook/react-vite';
import { createElement } from 'react';

const NO_SKIN = '';

const SKIN_ITEMS = [
  { value: NO_SKIN, title: 'Page' },
  ...Object.entries(SKINS_WITH_STORYBOOK).map(([value, { title }]) => ({
    value,
    title,
  })),
];

const withSkin: Decorator = (Story, { globals }) => {
  const skin: string = globals['skin'] ?? NO_SKIN;
  if (skin === NO_SKIN) return createElement(Story);
  return createElement(
    'div',
    { 'data-skin': skin, className: 'bg-ambient p-8 text-text' },
    createElement(Story),
  );
};

const preview: Preview = {
  globalTypes: {
    skin: {
      description: 'The band skin the story renders on',
      toolbar: { title: 'Skin', icon: 'paintbrush', items: SKIN_ITEMS },
    },
  },
  initialGlobals: { skin: NO_SKIN },
  // preview.css keys the canvas background off this same `.dark` class.
  decorators: [
    withSkin,
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
        wideDesktop: {
          name: 'Wide desktop (2560px)',
          styles: { width: '2560px', height: '1440px' },
          type: 'desktop',
        },
      },
    },
  },
};
export default preview;
