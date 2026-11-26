import { BRAND_VARIANT } from '@shinefold/config';
import type { THeadingText } from '@shinefold/ui/components/atoms/heading';
import { CtaModule } from '@shinefold/ui/components/organisms/cta-module';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';
import {
  MOCK_HIGHLIGHTED_PHRASE,
  MOCK_ONE_HIGHLIGHT_PIECES,
  toHeadingWords,
} from '@shinefold/ui/testing/heading-pieces';
import {
  MOCK_CTA_HEADING,
  MOCK_CTA_IMAGE_TEST_ID,
  mockCtaTestImage,
} from '@shinefold/ui/testing/organisms/cta-module/fixtures';
import type { ComponentType } from 'react';

export const mockCtaLayoutProps = () => ({
  tone: BRAND_VARIANT.PRIMARY,
  heading: MOCK_CTA_HEADING,
  children: <CtaModule.Media>{mockCtaTestImage()}</CtaModule.Media>,
});

export const describeCtaModuleLayout = <P extends THeadingText>(
  Component: ComponentType<P>,
  props: NoInfer<P>,
) => {
  const setup = customRender(Component, props);

  describe(`<${Component.name}/>`, () => {
    it('renders the heading', () => {
      setup();

      const heading = screen.getByRole('heading', { name: MOCK_CTA_HEADING });

      expect(heading).toBeVisible();
    });

    it('draws the heading pieces inside one heading named by the plain words', () => {
      customRender(Component, {
        ...props,
        heading: toHeadingWords(MOCK_ONE_HIGHLIGHT_PIECES),
        headingPieces: MOCK_ONE_HIGHLIGHT_PIECES,
      })();

      const heading = screen.getByRole('heading', {
        name: toHeadingWords(MOCK_ONE_HIGHLIGHT_PIECES),
      });
      const highlight = screen.getByText(MOCK_HIGHLIGHTED_PHRASE);

      expect(heading).toContainElement(highlight);
    });

    it('renders the plain heading when its pieces are empty', () => {
      customRender(Component, { ...props, headingPieces: [] })();

      const heading = screen.getByRole('heading', { name: MOCK_CTA_HEADING });

      expect(heading).toBeVisible();
    });

    it('keeps the image after the heading in the DOM', () => {
      setup();

      const heading = screen.getByRole('heading', { name: MOCK_CTA_HEADING });
      const image = screen.getByTestId(MOCK_CTA_IMAGE_TEST_ID);

      expect(heading.compareDocumentPosition(image)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
  });
};
