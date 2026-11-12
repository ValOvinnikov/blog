export const NAV_LINK_CURRENT = 'nav-link-marked nav-link-current';

export const NAV_LINK = [
  'nav-link-frame rounded-nav-link px-(--nav-link-padding-x) py-(--nav-link-padding-y)',
  'decoration-2 underline-offset-[0.3em] [text-decoration-skip-ink:auto]',
  'hover:nav-link-marked hover:nav-link-current',
  'aria-[current=page]:nav-link-marked aria-[current=page]:nav-link-current',
].join(' ');
