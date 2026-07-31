import '../index.css';

import type { Decorator, Preview } from '@storybook/nextjs-vite';
import { NextIntlClientProvider } from 'next-intl';

import messages from '../src/i18n/messages/en.json';

// `SmartLink` (the app's one link component — used directly by, or composed
// into, most `apps/web` components: `PortableTextRenderer`'s link mark,
// `PostContentsRail`, `Breadcrumbs`, ...) renders next-intl's `Link`, which
// reads locale/messages off React context via `useLocale`/`useIntlContext`.
// `@storybook/nextjs-vite` stubs Next's own navigation but doesn't supply
// this context, so any story rendering a real `SmartLink` throws "No intl
// context found" without it. Mirrors the same provider apps/web's own
// `[locale]/layout.tsx` and `@web/testing/custom-render` wrap every real
// render with. JSX (hence this file being `.tsx`, unlike `packages/ui`'s
// plain-`.ts` decorators) — `NextIntlClientProviderProps` declares
// `children` required, and passing it as a variadic `createElement` argument
// instead of a JSX child fails TS's overload resolution.
const withIntl: Decorator = (storyFn) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {storyFn()}
  </NextIntlClientProvider>
);

const preview: Preview = {
  decorators: [withIntl],
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
    // Custom viewport presets matching this app's real Tailwind `lg:`
    // breakpoint (1024px) — mirrors `packages/ui/.storybook/preview.ts`'s
    // `sm`/`md` presets. Don't redefine viewports or override them per-story,
    // except the narrow case documented in the `ui-storybook` skill (a
    // component whose rendering forks on a real, non-container media-query
    // breakpoint) — first precedent here: `PostContentsRail`'s mobile
    // disclosure vs. desktop rail, gated by `lg:`.
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile (<1024px)',
          styles: { width: '390px', height: '844px' },
          type: 'mobile',
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
