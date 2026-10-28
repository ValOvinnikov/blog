export const HEADER_ANCHOR = '[anchor-name:--header-bar]';

// Without anchor positioning a popover keeps the browser's own centred placement.
export const BELOW_HEADER = [
  'supports-[anchor-name:--a]:[position-anchor:--header-bar]',
  'supports-[anchor-name:--a]:inset-auto supports-[anchor-name:--a]:m-0 supports-[anchor-name:--a]:w-auto',
  'supports-[anchor-name:--a]:top-[anchor(bottom)]',
  'supports-[anchor-name:--a]:left-[anchor(left)] supports-[anchor-name:--a]:right-[anchor(right)]',
].join(' ');
