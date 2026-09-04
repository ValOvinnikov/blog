import userEvent from '@testing-library/user-event';
import { customRender, fireEvent, screen } from '@web/testing/custom-render';
import { act } from 'react';

import { BackToTopButton } from './back-to-top-button';

/**
 * jsdom has no real `IntersectionObserver` (the global `vitest-setup.ts`
 * stub is a no-op that never fires) — this fake captures the instance
 * created for the `<footer data-testid="site-footer">` element so tests can
 * trigger its callback directly, mirroring
 * `use-active-heading-id.test.tsx`'s approach.
 */
class FakeIntersectionObserver implements IntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];

  root = null;
  rootMargin = '';
  // Unused by this fake's own logic, but required to satisfy TypeScript's
  // `IntersectionObserver` interface (lib.dom.d.ts) — omitting it fails
  // type-check, so it stays despite not being read anywhere.
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

  trigger(isIntersecting: boolean) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this);
  }
}

const getObserver = (): FakeIntersectionObserver => {
  const [observer] = FakeIntersectionObserver.instances;
  if (!observer) {
    throw new Error('Expected an IntersectionObserver instance to exist.');
  }
  return observer;
};

const setup = customRender(BackToTopButton, {});

const setScrollY = (value: number) => {
  Object.defineProperty(window, 'scrollY', {
    value,
    configurable: true,
    writable: true,
  });
};

const fireScroll = () => {
  fireEvent.scroll(window);
};

describe(`<${BackToTopButton.name}/>`, () => {
  beforeEach(() => {
    document.body.innerHTML = '<footer data-testid="site-footer"></footer>';
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  });

  afterEach(() => {
    setScrollY(0);
    vi.unstubAllGlobals();
  });

  it('is hidden while scrolled less than one viewport height', () => {
    setup();

    const button = screen.getByRole('button', {
      hidden: true,
      name: 'Back to top',
    });

    expect(button).toHaveAttribute('inert');
  });

  it('becomes visible once scrolled past one viewport height', () => {
    setup();

    setScrollY(window.innerHeight + 1);
    fireScroll();

    expect(screen.getByRole('button', { name: 'Back to top' })).toBeVisible();
  });

  it('smooth-scrolls to the top on click', async () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo;
    setup();

    setScrollY(window.innerHeight + 1);
    fireScroll();

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Back to top' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('removes the scroll listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = setup();
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
    );
  });

  it('hides once the footer scrolls into view, even past one viewport height', () => {
    setup();

    setScrollY(window.innerHeight + 1);
    fireScroll();
    expect(screen.getByRole('button', { name: 'Back to top' })).toBeVisible();

    act(() => {
      getObserver().trigger(true);
    });

    expect(
      screen.getByRole('button', { hidden: true, name: 'Back to top' }),
    ).toHaveAttribute('inert');
  });

  it('reappears once the footer scrolls back out of view', () => {
    setup();

    setScrollY(window.innerHeight + 1);
    fireScroll();
    act(() => {
      getObserver().trigger(true);
    });
    act(() => {
      getObserver().trigger(false);
    });

    expect(screen.getByRole('button', { name: 'Back to top' })).toBeVisible();
  });

  it('disconnects the footer observer on unmount', () => {
    const { unmount } = setup();
    const disconnectSpy = vi.spyOn(getObserver(), 'disconnect');

    unmount();

    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('observes the site footer by test id, not an earlier in-DOM article footer', () => {
    // Mirrors a tagged post's real DOM: `Article.Footer` renders an
    // untagged `<footer>` inside `<article>`, earlier in document order
    // than the site chrome `Footer` rendered by `[locale]/layout.tsx`.
    document.body.innerHTML =
      '<footer></footer><footer data-testid="site-footer"></footer>';

    setup();

    const siteFooter = document.querySelector(
      'footer[data-testid="site-footer"]',
    );

    expect(getObserver().observed).toEqual([siteFooter]);
  });
});
