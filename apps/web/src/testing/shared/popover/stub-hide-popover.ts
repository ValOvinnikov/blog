export const stubHidePopover = () => {
  const hidePopover = vi.fn();
  Object.defineProperty(HTMLElement.prototype, 'hidePopover', {
    value: hidePopover,
    configurable: true,
  });
  return hidePopover;
};

export const unstubHidePopover = () => {
  Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
};
