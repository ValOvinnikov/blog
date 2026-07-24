import '../index.css';
import './preview.css';

import { BRAND_VARIANTS, type TBrandVariants } from '@blog/config';
import { withThemeByClassName } from '@storybook/addon-themes';
import type { Decorator, Preview, ReactRenderer } from '@storybook/react-vite';
import { useEffect } from 'storybook/preview-api';

// `.indigo` is the class `configs/tailwind/theme.css` defines for the
// Indigo brand variant (epic #512) — same derivation apps/web uses in
// `buildRootHtmlClassName` (`BRAND_VARIANTS.INDIGO.toLowerCase()`), so the
// class name stays a single source of truth instead of a repeated literal.
const INDIGO_CLASS_NAME = BRAND_VARIANTS.INDIGO.toLowerCase();

/**
 * Toolbar brand switcher: toggles the `.indigo` class on the preview
 * `<html>`, matching how apps/web applies the CMS-configured brand variant.
 *
 * This can't reuse `withThemeByClassName` a second time: the addon hardcodes
 * its global key to `theme` (`@storybook/addon-themes`'s internal
 * `GLOBAL_KEY = "theme"`), so a second `withThemeByClassName` call would
 * read/write the same global as the light/dark toggle below and collide
 * with it instead of driving an independent toolbar control. A plain
 * `globalTypes` entry (below) plus this decorator — the same pattern
 * `withThemeByClassName` itself is built from — gives the brand axis its
 * own `brand` global, independent of `theme`.
 *
 * Named as a function expression (not the usual `with*` arrow) so
 * `react-hooks/rules-of-hooks` recognizes it as a component and allows the
 * `useEffect` call below — an anonymous decorator fails that check.
 */
const withBrandVariant: Decorator = function BrandVariantDecorator(
  storyFn,
  context,
) {
  const variant =
    (context.globals.brand as TBrandVariants | undefined) ??
    BRAND_VARIANTS.CONSOLE;

  useEffect(() => {
    document.documentElement.classList.toggle(
      INDIGO_CLASS_NAME,
      variant === BRAND_VARIANTS.INDIGO,
    );
  }, [variant]);

  return storyFn();
};

const preview: Preview = {
  // Toolbar theme switcher: toggles the `.dark` class on the preview <html>,
  // matching how apps/web applies dark mode. `.dark` flips the theme tokens and
  // preview.css re-asserts the themed canvas background, so light/dark switches
  // the whole preview — background and all. Independent of the brand switcher
  // below: `.dark` and `.indigo` are separate classes on the same <html>, and
  // `configs/tailwind/theme.css` defines all four combinations (`:root`,
  // `.dark`, `.indigo`, `.dark.indigo`).
  decorators: [
    withThemeByClassName<ReactRenderer>({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
    }),
    withBrandVariant,
  ],
  initialGlobals: {
    brand: BRAND_VARIANTS.CONSOLE,
  },
  globalTypes: {
    brand: {
      name: 'Brand',
      description: 'Brand variant (Console / Indigo, epic #512)',
      toolbar: {
        title: 'Brand',
        icon: 'category',
        items: [
          { value: BRAND_VARIANTS.CONSOLE, title: 'Console' },
          { value: BRAND_VARIANTS.INDIGO, title: 'Indigo' },
        ],
        dynamicTitle: true,
      },
    },
  },
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
