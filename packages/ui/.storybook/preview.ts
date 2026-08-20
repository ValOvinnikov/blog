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

import { BRAND_VARIANTS, type TBrandVariants } from '@blog/config';
import { withThemeByClassName } from '@storybook/addon-themes';
import type { Decorator, Preview, ReactRenderer } from '@storybook/react-vite';
import { useEffect } from 'storybook/preview-api';

// Per-variant class names, mirroring the exact convention apps/web's
// `buildRootHtmlClassName` (`root-html-class-name.ts`) establishes: Console
// (the default) maps to `undefined` — no class applied — every other
// variant maps to its lowercase form, the class `configs/tailwind/theme.css`
// defines for it (epic #512). Derived from `BRAND_VARIANTS` rather than
// listing each variant by hand, so a future addition to `BRAND_VARIANTS`
// picks up a class here automatically, with zero changes to this file.
const BRAND_VARIANT_CLASS_NAMES: Record<TBrandVariants, string | undefined> =
  Object.fromEntries(
    Object.values(BRAND_VARIANTS).map((variant) => [
      variant,
      variant === BRAND_VARIANTS.CONSOLE ? undefined : variant.toLowerCase(),
    ]),
  ) as Record<TBrandVariants, string | undefined>;

// Every class name a brand variant can apply to `<html>`, so the decorator
// below can clear all of them before applying the current one — a genuine
// N-way switch instead of a binary toggle that assumes exactly one
// "no class" variant and one "has a class" variant.
const ALL_BRAND_CLASS_NAMES = Object.values(BRAND_VARIANT_CLASS_NAMES).filter(
  (className): className is string => className !== undefined,
);

/**
 * Toolbar brand switcher: applies the current variant's class (if any) to
 * the preview `<html>`, matching how apps/web applies the CMS-configured
 * brand variant.
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
    const variantClassName = BRAND_VARIANT_CLASS_NAMES[variant];
    ALL_BRAND_CLASS_NAMES.forEach((className) => {
      document.documentElement.classList.toggle(
        className,
        className === variantClassName,
      );
    });
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
        items: Object.values(BRAND_VARIANTS).map((value) => ({
          value,
          title: value.charAt(0) + value.slice(1).toLowerCase(),
        })),
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
