import { SITE_MESSAGES } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_VOICE_BOLD_TEXT,
  MOCK_VOICE_ITALIC_TEXT,
  MOCK_VOICE_LINK_HREF,
  MOCK_VOICE_LINK_TEXT,
  mockFormattedVoiceRich,
} from '@web/testing/shared/voice/fixtures';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';

import { NotFoundPage } from './not-found-page';

const RETURN_HOME = 'Return home';

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
      const link = screen.getByRole('link', { name: RETURN_HOME });

      expect(link).toHaveAttribute('href', '/');
    });

    it('renders the decorative arrow icon inside the link', () => {
      const link = screen.getByRole('link', { name: RETURN_HOME });
      const icon = within(link).getByTestId('not-found-arrow-icon');

      expect(icon).toBeVisible();
    });
  });

  it('renders tenant-authored supporting text with its formatting and link', () => {
    setup({ supportingText: mockFormattedVoiceRich() });

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
