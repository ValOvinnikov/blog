import userEvent, { type UserEvent } from '@testing-library/user-event';
import { fireEvent, renderElement, screen } from '@web/testing/custom-render';
import {
  getFakeIntersectionObserver,
  stubFakeIntersectionObserver,
} from '@web/testing/shared/intersection-observer/fake-intersection-observer';

import { BackToTopButton } from './back-to-top-button';

const BACK_TO_TOP_LABEL = 'Back to top';
const SITE_FOOTER_TEST_ID = 'site-footer';

const setup = (hasEarlierFooter = false) =>
  renderElement(
    <>
      {hasEarlierFooter ? <footer /> : null}
      <footer data-testid={SITE_FOOTER_TEST_ID} />
      <BackToTopButton />
    </>,
  );

const setScrollY = (value: number) => {
  Object.defineProperty(window, 'scrollY', {
    value,
    configurable: true,
    writable: true,
  });
};

describe(`<${BackToTopButton.name}/>`, () => {
  beforeEach(() => {
    stubFakeIntersectionObserver();
  });

  afterEach(() => {
    setScrollY(0);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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

    it('disconnects the footer observer on unmount', () => {
      const disconnectSpy = vi.spyOn(
        getFakeIntersectionObserver(),
        'disconnect',
      );

      unmount();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    describe('scrolled past one viewport height', () => {
      let user: UserEvent;

      beforeEach(() => {
        user = userEvent.setup();
        setScrollY(window.innerHeight + 1);
        fireEvent.scroll(window);
      });

      it('becomes visible', () => {
        const button = screen.getByRole('button', { name: BACK_TO_TOP_LABEL });

        expect(button).toBeVisible();
      });

      it('smooth-scrolls to the top on click', async () => {
        const scrollTo = vi.fn();
        vi.stubGlobal('scrollTo', scrollTo);
        const button = screen.getByRole('button', { name: BACK_TO_TOP_LABEL });

        await user.click(button);

        expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      });

      it('hides once the footer scrolls into view', () => {
        getFakeIntersectionObserver().trigger([{ isIntersecting: true }]);

        const button = screen.getByRole('button', {
          hidden: true,
          name: BACK_TO_TOP_LABEL,
        });

        expect(button).toHaveAttribute('inert');
      });

      it('reappears once the footer scrolls back out of view', () => {
        getFakeIntersectionObserver().trigger([{ isIntersecting: true }]);
        getFakeIntersectionObserver().trigger([{ isIntersecting: false }]);

        const button = screen.getByRole('button', { name: BACK_TO_TOP_LABEL });

        expect(button).toBeVisible();
      });
    });
  });

  it('removes its scroll listener on unmount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = setup();
    const [, scrollListener] =
      addEventListenerSpy.mock.calls.find(([type]) => type === 'scroll') ?? [];

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      scrollListener,
    );
  });

  it('observes the site footer, not an earlier article footer', () => {
    setup(true);

    const siteFooter = screen.getByTestId(SITE_FOOTER_TEST_ID);

    expect(getFakeIntersectionObserver().observed).toEqual([siteFooter]);
  });
});
