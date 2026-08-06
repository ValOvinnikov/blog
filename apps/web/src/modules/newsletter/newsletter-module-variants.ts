import { tv } from 'tailwind-variants';

export const newsletterModuleVariants = tv({
  slots: {
    // `NewsletterSignup.Full`'s own root carries no margin/padding of its
    // own (pure ui organism) — this is the section-level framing for the
    // Blog index page's page-builder placement. Deliberately light
    // (`py-page-y`, not `py-section`): the reverted implementation's
    // footer-band wrapper (`py-section`, clamp(3rem,8vw,6rem)) read as too
    // much dead air around a single form (#1200).
    root: ['flex justify-center', 'px-gutter py-page-y'],
  },
});
