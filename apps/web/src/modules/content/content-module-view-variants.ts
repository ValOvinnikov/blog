import { tv } from 'tailwind-variants';

export const contentModuleViewVariants = tv({
  slots: {
    // `ContentModuleUi`'s own `body` slot already caps width to
    // `max-w-prose`, narrower than `max-w-measure` — so this cap is a no-op
    // there and only matters for a caller with a wider ancestor. `Prose`
    // itself carries no width cap of its own, for the same reason as
    // `post-article-variants.ts`'s `prose` slot: a `FULL_BLEED` `bodyImage`
    // (marked `data-full-bleed` by `config/types.tsx`) is a direct child of
    // `Prose`, and needs `Prose`'s own box to stay uncapped so its breakout
    // resolves against the ancestor's width, not the narrower text measure.
    prose: [
      '[&>*:not([data-full-bleed])]:mx-auto',
      '[&>*:not([data-full-bleed])]:max-w-measure',
      '[&>*:not([data-full-bleed])]:lg:mx-0',
      '[&>*+*]:mt-6',
    ],
  },
});
