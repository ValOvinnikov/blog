import './preview.css';

import type { Decorator, Preview } from '@storybook/nextjs-vite';
import { AppProviders } from '@web/testing/providers';

import {
  SITE_THEME_GLOBAL_TYPES,
  SITE_THEME_INITIAL_GLOBALS,
  withSiteTheme,
} from './with-site-theme';

const withProviders: Decorator = (storyFn) => (
  <AppProviders>{storyFn()}</AppProviders>
);

const preview: Preview = {
  decorators: [withProviders, withSiteTheme],
  globalTypes: SITE_THEME_GLOBAL_TYPES,
  initialGlobals: SITE_THEME_INITIAL_GLOBALS,
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },
    nextjs: {
      appDirectory: true,
    },
    layout: 'fullscreen',
    // `tablet` sits between `md:` (768px) and `lg:` (1024px).
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile (<1024px)',
          styles: { width: '390px', height: '844px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet (768-1023px)',
          styles: { width: '820px', height: '1180px' },
          type: 'tablet',
        },
        desktop: {
          name: 'Desktop (≥1024px)',
          styles: { width: '1280px', height: '900px' },
          type: 'desktop',
        },
      },
    },
  },
};
export default preview;
