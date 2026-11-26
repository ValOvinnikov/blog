import { LOCALE_ISO_CODES, SITE_MESSAGES } from '@shinefold/config';
import { ERROR_BOUNDARY_LOG } from '@web/constants/error-boundary';
import { VoiceRichProvider } from '@web/context/voice-rich-provider';
import { renderElement, screen } from '@web/testing/custom-render';
import { testErrorPageContract } from '@web/testing/pages/error-page/error-page-contract';
import { MOCK_ERROR_WITH_DIGEST } from '@web/testing/shared/error/fixtures';
import { expectFormattedVoiceRich } from '@web/testing/shared/voice/expect-formatted-voice-rich';
import { mockFormattedVoiceRich } from '@web/testing/shared/voice/fixtures';
import { reportClientError } from '@web/utils/report-client-error';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';
import { NextIntlClientProvider } from 'next-intl';

import { LocaleErrorPage } from './locale-error-page';

vi.mock('@web/utils/report-client-error');

const { title, description, announcement, retry, goHome } =
  SITE_MESSAGES.localeErrorPage;

const reset = vi.fn();

const FreshMessagesPage = () => (
  <NextIntlClientProvider
    locale={LOCALE_ISO_CODES.EN}
    messages={{ ...SITE_MESSAGES }}
  >
    <LocaleErrorPage error={MOCK_ERROR_WITH_DIGEST} reset={reset} />
  </NextIntlClientProvider>
);

describe(`<${LocaleErrorPage.name}/>`, () => {
  testErrorPageContract({
    Page: LocaleErrorPage,
    logEvent: ERROR_BOUNDARY_LOG.LOCALE_RENDER_FAILED,
    copy: { title, tryAgain: retry, goHome, announcement },
  });

  it('renders the translated description', () => {
    renderElement(
      <LocaleErrorPage error={MOCK_ERROR_WITH_DIGEST} reset={reset} />,
    );

    const copy = screen.getByText(description);

    expect(copy).toBeVisible();
  });

  it('does not re-report when translations refresh but the error is the same', () => {
    const { rerender } = renderElement(<FreshMessagesPage />);

    rerender(<FreshMessagesPage />);

    expect(vi.mocked(reportClientError)).toHaveBeenCalledTimes(1);
  });

  it('renders the tenant-authored description with its formatting and link', () => {
    renderElement(
      <VoiceRichProvider
        values={{
          ...resolveVoiceRichFields({}, SITE_MESSAGES),
          localeErrorDescription: mockFormattedVoiceRich(),
        }}
      >
        <LocaleErrorPage error={MOCK_ERROR_WITH_DIGEST} reset={reset} />
      </VoiceRichProvider>,
    );

    expectFormattedVoiceRich();
  });
});
