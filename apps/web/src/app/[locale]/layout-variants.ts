import { tv } from 'tailwind-variants';

export const localeLayoutVariants = tv({
  slots: {
    root: ['flex min-h-dvh flex-col'],
    content: ['flex-1', 'bg-bg-subtle'],
    // The persistent newsletter band sits between the routed content and
    // `Footer` — `Footer`'s own `children` type only accepts its two named
    // slots (`Copyright`/`Nav`), so `NewsletterForm` can't nest inside it;
    // this sibling band is styled to read as part of the footer area
    // instead (design doc Feature 5, "site footer gains the full
    // NewsletterSignup").
    newsletterBand: [
      'border-t border-border-strong bg-surface',
      'px-gutter py-section',
      'flex justify-center',
    ],
  },
});
