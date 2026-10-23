import { LOCALE_ISO_CODES, SITE_MESSAGES } from '@blog/config';
import userEvent from '@testing-library/user-event';
import { VoiceRichProvider } from '@web/context/voice-rich-provider';
import { customRender, render, screen } from '@web/testing/custom-render';
import { AppProviders } from '@web/testing/providers';
import { ARIA_LIVE_ASSERTIVE_SELECTOR } from '@web/testing/shared/aria/constants';
import {
  MOCK_ERROR_DIGEST,
  MOCK_ERROR_WITH_DIGEST,
} from '@web/testing/shared/error/fixtures';
import {
  MOCK_VOICE_BOLD_TEXT,
  MOCK_VOICE_ITALIC_TEXT,
  MOCK_VOICE_LINK_HREF,
  MOCK_VOICE_LINK_TEXT,
  mockFormattedVoiceRich,
} from '@web/testing/shared/voice/fixtures';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';
import { NextIntlClientProvider } from 'next-intl';

import { LocaleErrorPage } from './locale-error-page';

const { reportClientErrorMock } = vi.hoisted(() => ({
  reportClientErrorMock: vi.fn(),
}));

vi.mock('@web/utils/report-client-error', () => ({
  reportClientError: reportClientErrorMock,
}));

const {
  announcement,
  retry: TRY_AGAIN,
  goHome: GO_HOME,
} = SITE_MESSAGES.localeErrorPage;

const error = MOCK_ERROR_WITH_DIGEST;
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
      const copy = screen.getByText(
        'An unexpected error occurred while rendering this page. You can try again, or head back to the homepage.',
      );
      const tryAgainButton = screen.getByRole('button', { name: TRY_AGAIN });

      expect(heading).toBeVisible();
      expect(copy).toBeVisible();
      expect(tryAgainButton).toBeVisible();
    });

    it('renders "Go home" as a real link, not a button', () => {
      const goHomeLink = screen.getByRole('link', { name: GO_HOME });

      expect(goHomeLink).toBeVisible();
      expect(goHomeLink).toHaveAttribute('href', '/');
    });

    it('announces the error to assistive technology after mount', () => {
      const liveRegion = screen.getByText(announcement, {
        selector: ARIA_LIVE_ASSERTIVE_SELECTOR,
      });

      expect(liveRegion).toBeVisible();
    });

    it('names both actions in the announcement as the controls render them', () => {
      const tryAgainLabel =
        screen.getByRole('button', { name: TRY_AGAIN }).textContent ?? '';
      const goHomeLabel =
        screen.getByRole('link', { name: GO_HOME }).textContent ?? '';

      expect(announcement.toLowerCase()).toContain(tryAgainLabel.toLowerCase());
      expect(announcement.toLowerCase()).toContain(goHomeLabel.toLowerCase());
    });

    it('sets aria-atomic on the live region', () => {
      const liveRegion = screen.getByText(announcement, {
        selector: ARIA_LIVE_ASSERTIVE_SELECTOR,
      });

      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('reports the error exactly once on mount, with its digest', () => {
      expect(reportClientErrorMock).toHaveBeenCalledTimes(1);
      expect(reportClientErrorMock).toHaveBeenCalledWith(
        'locale_error_boundary.render_failed',
        error,
        { digest: MOCK_ERROR_DIGEST },
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

  it('renders the tenant-authored description with its formatting and link', () => {
    render(
      <VoiceRichProvider
        values={{
          ...resolveVoiceRichFields({}, SITE_MESSAGES),
          localeErrorDescription: mockFormattedVoiceRich(),
        }}
      >
        <LocaleErrorPage error={error} reset={reset} />
      </VoiceRichProvider>,
      { wrapper: AppProviders },
    );

    const link = screen.getByRole('link', { name: MOCK_VOICE_LINK_TEXT });
    const bold = screen.getByText(MOCK_VOICE_BOLD_TEXT, {
      selector: 'strong',
    });
    const italic = screen.getByText(MOCK_VOICE_ITALIC_TEXT, {
      selector: 'em',
    });

    expect(link).toHaveAttribute('href', MOCK_VOICE_LINK_HREF);
    expect(bold).toBeVisible();
    expect(italic).toBeVisible();
  });
});
