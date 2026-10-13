import { SITE_MESSAGES } from '@blog/config';
import { VoiceRichProvider } from '@web/context/voice-rich-provider';
import { render, screen } from '@web/testing/custom-render';
import { AppProviders } from '@web/testing/providers';
import { makeFormattedVoiceRich } from '@web/testing/shared/voice/fixtures';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';

import { LocaleNotFoundPage } from './locale-not-found-page';

describe(`<${LocaleNotFoundPage.name}/>`, () => {
  it('renders the tenant-authored supporting text from the layout providers', () => {
    render(
      <VoiceRichProvider
        values={{
          ...resolveVoiceRichFields({}, SITE_MESSAGES),
          notFoundSupportingText: makeFormattedVoiceRich({
            linkText: 'search the archive',
            href: '/blog',
          }),
        }}
      >
        <LocaleNotFoundPage />
      </VoiceRichProvider>,
      { wrapper: AppProviders },
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'search the archive' }),
    ).toHaveAttribute('href', '/blog');
  });
});
