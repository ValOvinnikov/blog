import { tv } from 'tailwind-variants';

export const newsletterModuleVariants = tv({
  slots: {
    // `NewsletterSignup.Full`'s own root carries no margin/padding of its
    // own (pure ui organism) — this is the section-level framing for the
    // Blog index page's page-builder placement. Deliberately light
    // (`py-page-y`, not `py-section`): the reverted implementation's
    // footer-band wrapper (`py-section`, clamp(3rem,8vw,6rem)) read as too
    // much dead air around a single form (#1200). Top-only (`pt-page-y`,
    // not `py-page-y`): `blog-page-template`'s `<main>` already applies
    // `py-page-y` (top and bottom) around all page content, and this
    // module always renders last inside it — a bottom `py-page-y` here
    // would stack on top of the page-level one and double the gap below
    // the module.
    root: ['flex justify-center', 'px-gutter pt-page-y'],
  },
});
