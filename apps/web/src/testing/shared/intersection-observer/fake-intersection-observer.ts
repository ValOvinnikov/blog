import { act } from '@testing-library/react';

export class FakeIntersectionObserver implements IntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];

  root = null;
  rootMargin = '';
  scrollMargin = '';
  thresholds: number[] = [];
  callback: IntersectionObserverCallback;
  observed: Element[] = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target: Element) {
    this.observed.push(target);
  }

  unobserve() {}

  disconnect() {
    this.observed = [];
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  trigger(entries: Partial<IntersectionObserverEntry>[]) {
    act(() => {
      this.callback(entries as IntersectionObserverEntry[], this);
    });
  }
}

export const stubFakeIntersectionObserver = () => {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
};

export const getFakeIntersectionObserver = (): FakeIntersectionObserver => {
  const [observer] = FakeIntersectionObserver.instances;
  if (!observer) {
    throw new Error('Expected an IntersectionObserver instance to exist.');
  }
  return observer;
};
