export const stickyTopOf = (element: HTMLElement): number =>
  Number.parseFloat(getComputedStyle(element).top) || 0;
