import { act } from 'react';

type TObservedSize = { width: number; height: number };

const liveObservers = new Set<{ fire: () => void }>();

export const stubResizeObserver = (
  sizeOf: (target: Element) => TObservedSize,
) => {
  const original = globalThis.ResizeObserver;

  class StubResizeObserver implements ResizeObserver {
    private readonly targets = new Set<Element>();

    constructor(private readonly callback: ResizeObserverCallback) {}

    observe(target: Element) {
      this.targets.add(target);
      liveObservers.add(this);
      this.report(target);
    }

    unobserve(target: Element) {
      this.targets.delete(target);
    }

    disconnect() {
      this.targets.clear();
      liveObservers.delete(this);
    }

    fire() {
      this.targets.forEach((target) => this.report(target));
    }

    private report(target: Element) {
      const { width, height } = sizeOf(target);
      this.callback(
        [{ target, contentRect: { width, height } } as ResizeObserverEntry],
        this,
      );
    }
  }

  vi.stubGlobal('ResizeObserver', StubResizeObserver);

  return () => {
    liveObservers.clear();
    vi.stubGlobal('ResizeObserver', original);
  };
};

export const resizeObservedElements = () =>
  act(() => {
    liveObservers.forEach((observer) => observer.fire());
  });
