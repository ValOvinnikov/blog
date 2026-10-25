import userEvent from '@testing-library/user-event';
import { customRender, fireEvent, screen } from '@web/testing/custom-render';
import {
  getFakeIntersectionObserver,
  stubFakeIntersectionObserver,
} from '@web/testing/shared/intersection-observer/fake-intersection-observer';

import { BackToTopButton } from './back-to-top-button';

const BACK_TO_TOP_LABEL = 'Back to top';

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
    stubFakeIntersectionObserver();
  });

  afterEach(() => {
    setScrollY(0);
    vi.unstubAllGlobals();
  });

  describe('once rendered', () => {
    let unmount: () => void;

    beforeEach(() => {
      ({ unmount } = setup());
    });

    it('is hidden while scrolled less than one viewport height', () => {
      const button = screen.getByRole('button', {
        hidden: true,
        name: BACK_TO_TOP_LABEL,
      });

      expect(button).toHaveAttribute('inert');
    });

    it('removes the scroll listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
      );
    });

    it('disconnects the footer observer on unmount', () => {
      const disconnectSpy = vi.spyOn(
        getFakeIntersectionObserver(),
        'disconnect',
      );

      unmount();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    describe('scrolled past one viewport height', () => {
      beforeEach(() => {
        setScrollY(window.innerHeight + 1);
        fireScroll();
      });

      it('becomes visible once scrolled past one viewport height', () => {
        expect(
          screen.getByRole('button', { name: BACK_TO_TOP_LABEL }),
        ).toBeVisible();
      });

      it('smooth-scrolls to the top on click', async () => {
        const scrollTo = vi.fn();
        window.scrollTo = scrollTo;

        await userEvent
          .setup()
          .click(screen.getByRole('button', { name: BACK_TO_TOP_LABEL }));

        expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      });

      it('hides once the footer scrolls into view, even past one viewport height', () => {
        expect(
          screen.getByRole('button', { name: BACK_TO_TOP_LABEL }),
        ).toBeVisible();

        getFakeIntersectionObserver().trigger([{ isIntersecting: true }]);

        expect(
          screen.getByRole('button', { hidden: true, name: BACK_TO_TOP_LABEL }),
        ).toHaveAttribute('inert');
      });

      it('reappears once the footer scrolls back out of view', () => {
        getFakeIntersectionObserver().trigger([{ isIntersecting: true }]);
        getFakeIntersectionObserver().trigger([{ isIntersecting: false }]);

        expect(
          screen.getByRole('button', { name: BACK_TO_TOP_LABEL }),
        ).toBeVisible();
      });
    });
  });

  it('observes the site footer by test id, not an earlier in-DOM article footer', () => {
    document.body.innerHTML =
      '<footer></footer><footer data-testid="site-footer"></footer>';

    setup();

    const siteFooter = screen.getByTestId('site-footer');

    expect(getFakeIntersectionObserver().observed).toEqual([siteFooter]);
  });
});
