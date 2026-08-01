import userEvent from '@testing-library/user-event';
import { customRender, fireEvent, screen } from '@web/testing/custom-render';

import { BackToTopButton } from './back-to-top-button';

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
  afterEach(() => {
    setScrollY(0);
  });

  it('is hidden while scrolled less than one viewport height', () => {
    setup();

    expect(
      screen.queryByRole('button', { name: 'Back to top' }),
    ).not.toBeInTheDocument();
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
});
