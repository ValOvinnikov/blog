import { act, renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LeadMessage } from './lead-message';

const resizeCallbacks: ResizeObserverCallback[] = [];
let user: UserEvent;

class CapturingResizeObserver implements ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeCallbacks.push(callback);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

const resizeTo = (scrollHeight: number, clientHeight: number) => {
  vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(
    scrollHeight,
  );
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(
    clientHeight,
  );
  act(() => {
    resizeCallbacks.forEach((callback) =>
      callback([], new CapturingResizeObserver(() => {})),
    );
  });
};

beforeEach(() => {
  resizeCallbacks.length = 0;
  user = userEvent.setup();
  vi.stubGlobal('ResizeObserver', CapturingResizeObserver);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe(`<${LeadMessage.name}/>`, () => {
  it('offers no toggle when the message fits', () => {
    renderWithIntl(<LeadMessage message="Hello" />);
    resizeTo(20, 20);

    const message = screen.getByText('Hello');
    const toggle = screen.queryByRole('button');
    expect(message).toBeVisible();
    expect(toggle).not.toBeInTheDocument();
  });

  it('expands and collapses a clipped message', async () => {
    renderWithIntl(<LeadMessage message="A long message" />);
    resizeTo(120, 40);

    await user.click(screen.getByRole('button', { name: 'Show more' }));
    const showLess = screen.getByRole('button', { name: 'Show less' });
    expect(showLess).toHaveAttribute('aria-expanded', 'true');

    await user.click(showLess);
    const showMore = screen.getByRole('button', { name: 'Show more' });
    expect(showMore).toHaveAttribute('aria-expanded', 'false');
  });

  it('adds and removes the toggle as a resize starts and stops clipping', () => {
    renderWithIntl(<LeadMessage message="A long message" />);

    resizeTo(120, 40);
    const showMore = screen.getByRole('button', { name: 'Show more' });
    expect(showMore).toBeVisible();

    resizeTo(40, 40);
    const toggle = screen.queryByRole('button');
    expect(toggle).not.toBeInTheDocument();
  });
});
