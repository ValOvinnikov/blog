import { SITE_MESSAGES } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import { makeFormattedVoiceRich } from '@web/testing/shared/voice/fixtures';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';

import { NotFoundPage } from './not-found-page';

const setup = customRender(NotFoundPage, {
  supportingText: resolveVoiceRichFields({}, SITE_MESSAGES)
    .notFoundSupportingText,
});

describe(`<${NotFoundPage.name}/>`, () => {
  describe('with the catalog copy', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the eyebrow', () => {
      expect(screen.getByText('404')).toBeVisible();
    });

    it('renders a single h1 landmark heading', () => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Page not found' }),
      ).toBeVisible();
    });

    it('renders the supporting text', () => {
      expect(
        screen.getByText("The page you're looking for doesn't exist."),
      ).toBeVisible();
    });

    it('renders a link back home', () => {
      const link = screen.getByRole('link', { name: 'Return home' });
      expect(link).toHaveAttribute('href', '/');
    });

    it('renders the decorative arrow icon inside the link', () => {
      const link = screen.getByRole('link', { name: 'Return home' });
      expect(within(link).getByTestId('not-found-arrow-icon')).toBeVisible();
    });
  });

  it('renders tenant-authored supporting text with its formatting and link', () => {
    setup({
      supportingText: makeFormattedVoiceRich({
        linkText: 'search the archive',
        href: '/blog',
      }),
    });

    expect(
      screen.getByRole('link', { name: 'search the archive' }),
    ).toHaveAttribute('href', '/blog');
    expect(screen.getByText('bold', { selector: 'strong' })).toBeVisible();
    expect(screen.getByText('italic', { selector: 'em' })).toBeVisible();
  });
});
