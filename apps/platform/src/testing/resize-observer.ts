type TObservedSize = { width: number; height: number };

export const stubResizeObserver = (
  sizeOf: (target: Element) => TObservedSize,
) => {
  const original = globalThis.ResizeObserver;

  class StubResizeObserver implements ResizeObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}

    observe(target: Element) {
      const { width, height } = sizeOf(target);
      this.callback(
        [{ target, contentRect: { width, height } } as ResizeObserverEntry],
        this,
      );
    }

    unobserve() {}

    disconnect() {}
  }

  vi.stubGlobal('ResizeObserver', StubResizeObserver);

  return () => {
    vi.stubGlobal('ResizeObserver', original);
  };
};
