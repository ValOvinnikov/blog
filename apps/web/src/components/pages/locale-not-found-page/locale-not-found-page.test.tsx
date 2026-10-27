import { SITE_MESSAGES } from '@blog/config';
import { VoiceRichProvider } from '@web/context/voice-rich-provider';
import { renderElement, screen } from '@web/testing/custom-render';
import {
  MOCK_VOICE_LINK_HREF,
  MOCK_VOICE_LINK_TEXT,
  mockFormattedVoiceRich,
} from '@web/testing/shared/voice/fixtures';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';

import { LocaleNotFoundPage } from './locale-not-found-page';

describe(`<${LocaleNotFoundPage.name}/>`, () => {
  it('renders the tenant-authored supporting text from the layout providers', () => {
    renderElement(
      <VoiceRichProvider
        values={{
          ...resolveVoiceRichFields({}, SITE_MESSAGES),
          notFoundSupportingText: mockFormattedVoiceRich(),
        }}
      >
        <LocaleNotFoundPage />
      </VoiceRichProvider>,
    );

    const heading = screen.getByRole('heading', {
      level: 1,
      name: SITE_MESSAGES.notFound.heading,
    });
    const link = screen.getByRole('link', { name: MOCK_VOICE_LINK_TEXT });

    expect(heading).toBeVisible();
    expect(link).toHaveAttribute('href', MOCK_VOICE_LINK_HREF);
  });
});
