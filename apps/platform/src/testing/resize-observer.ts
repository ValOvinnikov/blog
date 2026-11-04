type TObservedSize = { width: number; height: number };

type TSizeOf = (target: Element) => TObservedSize;

export const stubResizeObserver = (sizeOf: TSizeOf) => {
  const original = globalThis.ResizeObserver;
  const observers = new Set<StubResizeObserver>();
  let currentSizeOf = sizeOf;

  class StubResizeObserver implements ResizeObserver {
    private readonly targets = new Set<Element>();

    constructor(private readonly callback: ResizeObserverCallback) {
      observers.add(this);
    }

    observe(target: Element) {
      this.targets.add(target);
      this.report(target);
    }

    report(target: Element) {
      const { width, height } = currentSizeOf(target);
      this.callback(
        [{ target, contentRect: { width, height } } as ResizeObserverEntry],
        this,
      );
    }

    reportAll() {
      this.targets.forEach((target) => this.report(target));
    }

    unobserve(target: Element) {
      this.targets.delete(target);
    }

    disconnect() {
      this.targets.clear();
      observers.delete(this);
    }
  }

  vi.stubGlobal('ResizeObserver', StubResizeObserver);

  const restore = () => {
    vi.stubGlobal('ResizeObserver', original);
  };

  const resize = (nextSizeOf: TSizeOf) => {
    currentSizeOf = nextSizeOf;
    observers.forEach((observer) => observer.reportAll());
  };

  return Object.assign(restore, { resize });
};
