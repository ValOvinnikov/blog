import userEvent from '@testing-library/user-event';
import messages from '@web/i18n/messages/en.json';
import { customRender, render, screen } from '@web/testing/custom-render';
import { NextIntlClientProvider } from 'next-intl';

import { LocaleErrorPage } from './locale-error-page';

const { reportClientErrorMock } = vi.hoisted(() => ({
  reportClientErrorMock: vi.fn(),
}));

vi.mock('@web/utils/report-client-error', () => ({
  reportClientError: reportClientErrorMock,
}));

const error = Object.assign(new Error('render blew up'), {
  digest: 'digest-123',
});
const reset = vi.fn();

const setup = customRender(LocaleErrorPage, { error, reset });

describe(`<${LocaleErrorPage.name}/>`, () => {
  beforeEach(() => {
    reportClientErrorMock.mockClear();
    reset.mockClear();
  });

  it('renders the translated heading, copy, and actions', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'An unexpected error occurred while rendering this page. You can try again, or head back to the homepage.',
      ),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  it('renders "Go home" as a real link, not a button', () => {
    setup();

    const goHomeLink = screen.getByRole('link', { name: 'Go home' });
    expect(goHomeLink).toBeVisible();
    expect(goHomeLink).toHaveAttribute('href', '/');
  });

  it('announces the error to assistive technology after mount', () => {
    const { container } = setup();

    const liveRegion = container.querySelector('[aria-live="assertive"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.textContent).toBe(messages.localeErrorPage.announcement);
    expect(messages.localeErrorPage.announcement).not.toBe(
      messages.localeErrorPage.title,
    );
  });

  it('names both available actions in the announcement, matching the rendered controls', () => {
    const { container } = setup();

    const liveRegion = container.querySelector('[aria-live="assertive"]');
    const announcement = liveRegion?.textContent?.toLowerCase() ?? '';
    const tryAgainLabel =
      screen.getByRole('button', { name: 'Try again' }).textContent ?? '';
    const goHomeLabel =
      screen.getByRole('link', { name: 'Go home' }).textContent ?? '';

    expect(announcement).toContain(tryAgainLabel.toLowerCase());
    expect(announcement).toContain(goHomeLabel.toLowerCase());
  });

  it('sets aria-atomic on the live region', () => {
    const { container } = setup();

    const liveRegion = container.querySelector('[aria-live="assertive"]');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('reports the error exactly once on mount, with its digest', () => {
    setup();

    expect(reportClientErrorMock).toHaveBeenCalledTimes(1);
    expect(reportClientErrorMock).toHaveBeenCalledWith(
      'locale_error_boundary.render_failed',
      error,
      { digest: 'digest-123' },
    );
  });

  it('does not re-report when re-rendered with the same error', () => {
    const { rerender } = setup();

    rerender(<LocaleErrorPage error={error} reset={reset} />);

    expect(reportClientErrorMock).toHaveBeenCalledTimes(1);
  });

  it("does not re-report when `t`'s identity changes but the error does not", () => {
    // `NextIntlClientProvider` memoizes `t` on its `messages` prop identity
    // (among other things) — a fresh object with the same content forces a
    // genuinely new `t` reference on the next render, independent of the
    // app's current (incidental) provider stability.
    const { rerender } = render(
      <NextIntlClientProvider locale="en" messages={{ ...messages }}>
        <LocaleErrorPage error={error} reset={reset} />
      </NextIntlClientProvider>,
    );

    rerender(
      <NextIntlClientProvider locale="en" messages={{ ...messages }}>
        <LocaleErrorPage error={error} reset={reset} />
      </NextIntlClientProvider>,
    );

    expect(reportClientErrorMock).toHaveBeenCalledTimes(1);
  });

  it('calls reset when "Try again" is clicked', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('moves focus to the page container on mount', () => {
    setup();

    expect(screen.getByRole('main')).toHaveFocus();
  });
});
