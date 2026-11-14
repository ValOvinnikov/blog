import { BRAND_VARIANT } from '@blog/config';
import { CtaModule } from '@blog/ui/components/organisms/cta-module';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import {
  MOCK_CTA_HEADING,
  MOCK_CTA_IMAGE_TEST_ID,
  mockCtaTestImage,
} from '@blog/ui/testing/organisms/cta-module/fixtures';
import type { ComponentType } from 'react';

export const mockCtaLayoutProps = () => ({
  tone: BRAND_VARIANT.PRIMARY,
  heading: MOCK_CTA_HEADING,
  children: <CtaModule.Media>{mockCtaTestImage()}</CtaModule.Media>,
});

export const describeCtaModuleLayout = <P extends object>(
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
