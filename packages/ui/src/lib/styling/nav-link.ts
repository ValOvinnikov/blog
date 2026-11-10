export const NAV_LINK_CURRENT = 'nav-link-marked';

export const NAV_LINK = [
  'rounded-nav-link p-(--nav-link-padding)',
  'decoration-2 underline-offset-[0.3em] [text-decoration-skip-ink:auto]',
  'hover:nav-link-marked aria-[current=page]:nav-link-marked',
].join(' ');
