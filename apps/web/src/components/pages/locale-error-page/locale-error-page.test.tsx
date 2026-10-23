import { LOCALE_ISO_CODES, SITE_MESSAGES } from '@blog/config';
import userEvent from '@testing-library/user-event';
import { VoiceRichProvider } from '@web/context/voice-rich-provider';
import { customRender, render, screen } from '@web/testing/custom-render';
import { AppProviders } from '@web/testing/providers';
import { mockFormattedVoiceRich } from '@web/testing/shared/voice/fixtures';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';
import { NextIntlClientProvider } from 'next-intl';

import { LocaleErrorPage } from './locale-error-page';

const { reportClientErrorMock } = vi.hoisted(() => ({
  reportClientErrorMock: vi.fn(),
}));

vi.mock('@web/utils/report-client-error', () => ({
  reportClientError: reportClientErrorMock,
}));

const DIGEST = 'digest-123';
const VOICED_LINK_TEXT = 'status page';
const VOICED_LINK_HREF = 'https://status.example.com';
const TRY_AGAIN = 'Try again';
const GO_HOME = 'Go home';
const { announcement: ANNOUNCEMENT } = SITE_MESSAGES.localeErrorPage;

const error = Object.assign(new Error('render blew up'), {
  digest: DIGEST,
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
      const heading = screen.getByRole('heading', {
        level: 1,
        name: 'Something went wrong',
      });
      const description = screen.getByText(
        'An unexpected error occurred while rendering this page. You can try again, or head back to the homepage.',
      );
      const tryAgainButton = screen.getByRole('button', { name: TRY_AGAIN });
      expect(heading).toBeVisible();
      expect(description).toBeVisible();
      expect(tryAgainButton).toBeVisible();
    });

    it('renders "Go home" as a real link, not a button', () => {
      const goHomeLink = screen.getByRole('link', { name: GO_HOME });
      expect(goHomeLink).toBeVisible();
      expect(goHomeLink).toHaveAttribute('href', '/');
    });

    it('announces the error to assistive technology after mount', () => {
      const liveRegion = screen.getByText(ANNOUNCEMENT);
      expect(liveRegion).toBeVisible();
    });

    it('names both rendered actions in the announcement', () => {
      const tryAgainLabel =
        screen.getByRole('button', { name: TRY_AGAIN }).textContent ?? '';
      const goHomeLabel =
        screen.getByRole('link', { name: GO_HOME }).textContent ?? '';

      expect(ANNOUNCEMENT.toLowerCase()).toContain(tryAgainLabel.toLowerCase());
      expect(ANNOUNCEMENT.toLowerCase()).toContain(goHomeLabel.toLowerCase());
    });

    it('sets aria-atomic on the live region', () => {
      const liveRegion = screen.getByText(ANNOUNCEMENT);
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('reports the error exactly once on mount, with its digest', () => {
      expect(reportClientErrorMock).toHaveBeenCalledTimes(1);
      expect(reportClientErrorMock).toHaveBeenCalledWith(
        'locale_error_boundary.render_failed',
        error,
        { digest: DIGEST },
      );
    });

    it('does not re-report when re-rendered with the same error', () => {
      rerender(<LocaleErrorPage error={error} reset={reset} />);

      expect(reportClientErrorMock).toHaveBeenCalledTimes(1);
    });

    it('calls reset when "Try again" is clicked', async () => {
      const user = userEvent.setup();

      const tryAgainButton = screen.getByRole('button', { name: TRY_AGAIN });
      await user.click(tryAgainButton);

      expect(reset).toHaveBeenCalledTimes(1);
    });

    it('moves focus to the page container on mount', () => {
      const main = screen.getByRole('main');
      expect(main).toHaveFocus();
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
      { wrapper: AppProviders },
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

  it('renders the tenant-authored description with its link', () => {
    render(
      <VoiceRichProvider
        values={{
          ...resolveVoiceRichFields({}, SITE_MESSAGES),
          localeErrorDescription: mockFormattedVoiceRich({
            linkText: VOICED_LINK_TEXT,
            href: VOICED_LINK_HREF,
          }),
        }}
      >
        <LocaleErrorPage error={error} reset={reset} />
      </VoiceRichProvider>,
      { wrapper: AppProviders },
    );

    const link = screen.getByRole('link', { name: VOICED_LINK_TEXT });
    expect(link).toHaveAttribute('href', VOICED_LINK_HREF);
  });
});
