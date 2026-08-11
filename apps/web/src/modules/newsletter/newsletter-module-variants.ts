import { tv } from 'tailwind-variants';

export const newsletterModuleVariants = tv({
  slots: {
    // `NewsletterSignup.Full`'s own root carries no margin/padding of its
    // own (pure ui organism) — this is the horizontal framing for the Blog
    // index page's page-builder placement. Vertical spacing above/below is
    // owned by the `Section` wrapper (`appearance.spacingTop`/`spacingBottom`,
    // default `SPACING_SCALE.MD`) this module now renders inside — no
    // `py-*`/`pt-*` here, or it would stack with `Section`'s own padding.
    root: ['flex justify-center', 'px-gutter'],
  },
});
