import { tv } from 'tailwind-variants';

export const contentModuleViewVariants = tv({
  slots: {
    // The cap sits on the children, not the box: a `data-full-bleed` child's
    // `min(100vw, var(--container-page))` needs `Prose`'s own box uncapped
    // to resolve against a wider ancestor.
    prose: [
      '[&>*:not([data-full-bleed])]:mx-auto',
      '[&>*:not([data-full-bleed])]:max-w-measure',
      '[&>*:not([data-full-bleed])]:lg:mx-0',
      '[&>*+*]:mt-6',
    ],
  },
});
