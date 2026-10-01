import '../index.css';

import { PRESET_ID, PRESET_REGISTRY } from '@blog/config';
import type { Decorator, Preview } from '@storybook/nextjs-vite';
import { resolveFontVariableClassName } from '@web/config/fonts';
import { AppProviders } from '@web/testing/providers';

// Must go on the root element, not a wrapper div: the `--font-*-family`
// custom properties are read on `body`, which doesn't inherit them from a
// descendant.
const { headingFont, bodyFont } =
  PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;
document.documentElement.classList.add(
  ...resolveFontVariableClassName(headingFont, bodyFont).split(' '),
);

// `AppProviders` supplies the same `NextIntlClientProvider` +
// `SanityImageBaseUrlProvider` stack `[tenant]/[locale]/layout.tsx` provides
// in the real app — every story rendering a real `SmartLink` (next-intl's
// `Link`, reading locale/messages off context) or a `SanityImage` throws
// without it. Shared with `@web/testing/custom-render` rather than
// redeclared here, so the two entry points can't drift.
const withProviders: Decorator = (storyFn) => (
  <AppProviders>{storyFn()}</AppProviders>
);

const preview: Preview = {
  decorators: [withProviders],
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
