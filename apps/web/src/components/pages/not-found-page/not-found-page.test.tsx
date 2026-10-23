import { SITE_MESSAGES } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import { mockFormattedVoiceRich } from '@web/testing/shared/voice/fixtures';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';

import { NotFoundPage } from './not-found-page';

const HOME_LINK_NAME = 'Return home';
const VOICED_LINK_TEXT = 'search the archive';
const VOICED_LINK_HREF = '/blog';

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
      const eyebrow = screen.getByText('404');
      expect(eyebrow).toBeVisible();
    });

    it('renders a single h1 landmark heading', () => {
      const heading = screen.getByRole('heading', {
        level: 1,
        name: 'Page not found',
      });
      expect(heading).toBeVisible();
    });

    it('renders the supporting text', () => {
      const supportingText = screen.getByText(
        "The page you're looking for doesn't exist.",
      );
      expect(supportingText).toBeVisible();
    });

    it('renders a link back home', () => {
      const link = screen.getByRole('link', { name: HOME_LINK_NAME });
      expect(link).toHaveAttribute('href', '/');
    });

    it('renders the decorative arrow icon inside the link', () => {
      const link = screen.getByRole('link', { name: HOME_LINK_NAME });
      const arrowIcon = within(link).getByTestId('not-found-arrow-icon');
      expect(arrowIcon).toBeVisible();
    });
  });

  it('renders tenant-authored supporting text with its link', () => {
    setup({
      supportingText: mockFormattedVoiceRich({
        linkText: VOICED_LINK_TEXT,
        href: VOICED_LINK_HREF,
      }),
    });

    const link = screen.getByRole('link', { name: VOICED_LINK_TEXT });
    expect(link).toHaveAttribute('href', VOICED_LINK_HREF);
  });
});
