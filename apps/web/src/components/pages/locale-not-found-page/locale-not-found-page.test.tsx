import { SITE_MESSAGES } from '@blog/config';
import { VoiceRichProvider } from '@web/context/voice-rich-provider';
import { render, screen } from '@web/testing/custom-render';
import { AppProviders } from '@web/testing/providers';
import { mockFormattedVoiceRich } from '@web/testing/shared/voice/fixtures';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';

import { LocaleNotFoundPage } from './locale-not-found-page';

const VOICED_LINK_TEXT = 'search the archive';
const VOICED_LINK_HREF = '/blog';

describe(`<${LocaleNotFoundPage.name}/>`, () => {
  it('renders the tenant-authored supporting text from the layout providers', () => {
    render(
      <VoiceRichProvider
        values={{
          ...resolveVoiceRichFields({}, SITE_MESSAGES),
          notFoundSupportingText: mockFormattedVoiceRich({
            linkText: VOICED_LINK_TEXT,
            href: VOICED_LINK_HREF,
          }),
        }}
      >
        <LocaleNotFoundPage />
      </VoiceRichProvider>,
      { wrapper: AppProviders },
    );

    const link = screen.getByRole('link', { name: VOICED_LINK_TEXT });
    expect(link).toHaveAttribute('href', VOICED_LINK_HREF);
  });
});
