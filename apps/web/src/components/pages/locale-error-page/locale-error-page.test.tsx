import { LOCALE_ISO_CODES, SITE_MESSAGES } from '@blog/config';
import userEvent from '@testing-library/user-event';
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
  describe('when rendered', () => {
    let rerender: ReturnType<typeof setup>['rerender'];

    beforeEach(() => {
      ({ rerender } = setup());
    });

    it('renders the translated heading, copy, and actions', () => {
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
      const goHomeLink = screen.getByRole('link', { name: 'Go home' });
      expect(goHomeLink).toBeVisible();
      expect(goHomeLink).toHaveAttribute('href', '/');
    });

    it('announces the error to assistive technology after mount', () => {
      expect(
        screen.getByText(SITE_MESSAGES.localeErrorPage.announcement),
      ).toBeVisible();
      expect(SITE_MESSAGES.localeErrorPage.announcement).not.toBe(
        SITE_MESSAGES.localeErrorPage.title,
      );
    });

    it('names both available actions in the announcement, matching the rendered controls', () => {
      const announcement =
        SITE_MESSAGES.localeErrorPage.announcement.toLowerCase();
      const tryAgainLabel =
        screen.getByRole('button', { name: 'Try again' }).textContent ?? '';
      const goHomeLabel =
        screen.getByRole('link', { name: 'Go home' }).textContent ?? '';

      expect(announcement).toContain(tryAgainLabel.toLowerCase());
      expect(announcement).toContain(goHomeLabel.toLowerCase());
    });

    it('sets aria-atomic on the live region', () => {
      expect(
        screen.getByText(SITE_MESSAGES.localeErrorPage.announcement),
      ).toHaveAttribute('aria-atomic', 'true');
    });

    it('reports the error exactly once on mount, with its digest', () => {
      expect(reportClientErrorMock).toHaveBeenCalledTimes(1);
      expect(reportClientErrorMock).toHaveBeenCalledWith(
        'locale_error_boundary.render_failed',
        error,
        { digest: 'digest-123' },
      );
    });

    it('does not re-report when re-rendered with the same error', () => {
      rerender(<LocaleErrorPage error={error} reset={reset} />);

      expect(reportClientErrorMock).toHaveBeenCalledTimes(1);
    });

    it('calls reset when "Try again" is clicked', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(reset).toHaveBeenCalledTimes(1);
    });

    it('moves focus to the page container on mount', () => {
      expect(screen.getByRole('main')).toHaveFocus();
    });
  });

  it("does not re-report when `t`'s identity changes but the error does not", () => {
    const { rerender } = render(
      <NextIntlClientProvider
        locale={LOCALE_ISO_CODES.EN}
        messages={{ ...SITE_MESSAGES }}
      >
        <LocaleErrorPage error={error} reset={reset} />
      </NextIntlClientProvider>,
    );

    rerender(
      <NextIntlClientProvider
        locale={LOCALE_ISO_CODES.EN}
        messages={{ ...SITE_MESSAGES }}
      >
        <LocaleErrorPage error={error} reset={reset} />
      </NextIntlClientProvider>,
    );

    expect(reportClientErrorMock).toHaveBeenCalledTimes(1);
  });
});
