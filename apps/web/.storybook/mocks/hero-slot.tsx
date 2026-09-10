import { BRAND_VARIANT } from '@blog/config';
import { HeroModuleView } from '@web/modules/hero/hero-module-view';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

/**
 * Storybook-only stand-in for the real `HeroSlot`, which dispatches to a
 * Server Component that fetches its own `module_hero*` document — no live
 * Sanity connection is available in Storybook (`.storybook/main.ts` aliases
 * the exact specifier to this module). Renders the real, purely
 * presentational `HeroModuleView` with fixed content so a page-composition
 * story can show its hero region.
 */
export const HeroSlot = () => (
  <HeroModuleView
    id="topics-hero-1"
    brandVariant={BRAND_VARIANT.BRAND_PRIMARY}
    eyebrow="Architecture"
    title="Building a Design System from Scratch"
    subtitle="A deep dive into Atomic Design principles, Tailwind CSS v4, and class-variance-authority — all working together in a portable component library."
    sanityImage={makeSanityImage()}
    primaryAction={{
      label: 'Read more',
      href: '/blog/building-a-design-system',
      target: undefined,
      platform: undefined,
      hiddenLabelSuffix: 'Building a Design System from Scratch',
      appearance: undefined,
    }}
    secondaryAction={undefined}
    layout={undefined}
  />
);
