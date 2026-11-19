import { LOCALE_ISO_CODES, routes, SITE_MESSAGES } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { ERROR_BOUNDARY_LOG } from '@web/constants/error-boundary';
import { VoiceRichProvider } from '@web/context/voice-rich-provider';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';
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
  title: HEADING,
  description: DESCRIPTION,
  announcement,
  retry: TRY_AGAIN,
  goHome: GO_HOME,
} = SITE_MESSAGES.localeErrorPage;

const error = MOCK_ERROR_WITH_DIGEST;
const reset = vi.fn();

const setup = customRender(LocaleErrorPage, { error, reset });

const FreshMessagesPage = () => (
  <NextIntlClientProvider
    locale={LOCALE_ISO_CODES.EN}
    messages={{ ...SITE_MESSAGES }}
  >
    <LocaleErrorPage error={error} reset={reset} />
  </NextIntlClientProvider>
);

describe(`<${LocaleErrorPage.name}/>`, () => {
  describe('when rendered', () => {
    let rerender: ReturnType<typeof setup>['rerender'];
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
      ({ rerender } = setup());
    });

    it('renders the translated heading and copy', () => {
      const heading = screen.getByRole('heading', {
        level: 1,
        name: HEADING,
      });
      const copy = screen.getByText(DESCRIPTION);

      expect(heading).toBeVisible();
      expect(copy).toBeVisible();
    });

    describe('its actions', () => {
      let tryAgainButton: HTMLElement;
      let goHomeLink: HTMLElement;

      beforeEach(() => {
        tryAgainButton = screen.getByRole('button', { name: TRY_AGAIN });
        goHomeLink = screen.getByRole('link', { name: GO_HOME });
      });

      it('renders a try-again button', () => {
        expect(tryAgainButton).toBeVisible();
      });

      it('calls reset when "Try again" is clicked', async () => {
        await user.click(tryAgainButton);

        expect(reset).toHaveBeenCalledTimes(1);
      });

      it('renders "Go home" as a real link, not a button', () => {
        expect(goHomeLink).toBeVisible();
        expect(goHomeLink).toHaveAttribute('href', routes.home());
      });

      it('names both actions in the announcement as the controls render them', () => {
        const lowerAnnouncement = announcement.toLowerCase();

        expect(lowerAnnouncement).toContain(
          (tryAgainButton.textContent ?? '').toLowerCase(),
        );
        expect(lowerAnnouncement).toContain(
          (goHomeLink.textContent ?? '').toLowerCase(),
        );
      });
    });

    describe('its live region', () => {
      let liveRegion: HTMLElement;

      beforeEach(() => {
        liveRegion = screen.getByText(announcement, {
          selector: ARIA_LIVE_ASSERTIVE_SELECTOR,
        });
      });

      it('announces the error to assistive technology after mount', () => {
        expect(liveRegion).toBeVisible();
      });

      it('sets aria-atomic on the live region', () => {
        expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
      });
    });

    it('reports the error exactly once on mount, with its digest', () => {
      expect(reportClientErrorMock).toHaveBeenCalledTimes(1);
      expect(reportClientErrorMock).toHaveBeenCalledWith(
        ERROR_BOUNDARY_LOG.LOCALE_RENDER_FAILED,
        error,
        { digest: MOCK_ERROR_DIGEST },
      );
    });

    it('does not re-report when re-rendered with the same error', () => {
      rerender(<LocaleErrorPage error={error} reset={reset} />);

      expect(reportClientErrorMock).toHaveBeenCalledTimes(1);
    });

    it('moves focus to the page container on mount', () => {
      const main = screen.getByRole('main');

      expect(main).toHaveFocus();
    });
  });

  it('does not re-report when translations refresh but the error is the same', () => {
    const { rerender } = renderElement(<FreshMessagesPage />);

    rerender(<FreshMessagesPage />);

    expect(reportClientErrorMock).toHaveBeenCalledTimes(1);
  });

  it('renders the tenant-authored description with its formatting and link', () => {
    renderElement(
      <VoiceRichProvider
        values={{
          ...resolveVoiceRichFields({}, SITE_MESSAGES),
          localeErrorDescription: mockFormattedVoiceRich(),
        }}
      >
        <LocaleErrorPage error={error} reset={reset} />
      </VoiceRichProvider>,
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
