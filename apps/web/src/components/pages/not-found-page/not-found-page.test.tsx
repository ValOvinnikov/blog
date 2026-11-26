import { routes, SITE_MESSAGES } from '@shinefold/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import { expectFormattedVoiceRich } from '@web/testing/shared/voice/expect-formatted-voice-rich';
import { mockFormattedVoiceRich } from '@web/testing/shared/voice/fixtures';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';

import { NotFoundPage } from './not-found-page';

const { eyebrow, heading, supportingText, returnHome } = SITE_MESSAGES.notFound;

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
      const eyebrowText = screen.getByText(eyebrow);

      expect(eyebrowText).toBeVisible();
    });

    it('renders a single h1 heading', () => {
      const h1 = screen.getByRole('heading', { level: 1, name: heading });

      expect(h1).toBeVisible();
    });

    it('renders the supporting text', () => {
      const supportingParagraph = screen.getByText(supportingText);

      expect(supportingParagraph).toBeVisible();
    });

    describe('its link back home', () => {
      let link: HTMLElement;

      beforeEach(() => {
        link = screen.getByRole('link', { name: returnHome });
      });

      it('points at the home route', () => {
        expect(link).toHaveAttribute('href', routes.home());
      });

      it('renders the decorative arrow icon inside the link', () => {
        const icon = within(link).getByTestId('not-found-arrow-icon');

        expect(icon).toBeVisible();
      });
    });
  });

  it('renders tenant-authored supporting text with its formatting and link', () => {
    setup({ supportingText: mockFormattedVoiceRich() });

    expectFormattedVoiceRich();
  });
});
