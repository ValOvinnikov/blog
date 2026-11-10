import { CTA_VARIANT } from '@blog/config';
import { CtaModule } from '@blog/ui/components/organisms/cta-module';
import { ctaModuleVariants } from '@blog/ui/components/organisms/cta-module/cta-module-variants';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import {
  MOCK_CTA_HEADING,
  MOCK_CTA_IMAGE_TEST_ID,
  mockCtaTestImage,
} from '@blog/ui/testing/organisms/cta-module/fixtures';
import { faker } from '@faker-js/faker';

import { CtaModuleLayout } from './cta-module-layout';

faker.seed(123);

const MOCK_HEADING_ID = faker.lorem.slug(2);
const MOCK_EYEBROW = faker.lorem.words(2);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence(8);
const MOCK_CONTENT = faker.lorem.sentence(5);
const MOCK_FOOTNOTE = faker.lorem.sentence(6);
const MOCK_UNMATCHED = faker.lorem.sentence(4);
const MOCK_ACTION_LABEL = faker.lorem.word();
const MOCK_ACTION_PATH = `/${faker.lorem.slug(1)}`;

const setup = customRender(CtaModuleLayout, {
  styles: ctaModuleVariants({ variant: CTA_VARIANT.CALLOUT }),
  heading: MOCK_CTA_HEADING,
});

describe(`<${CtaModuleLayout.name}/>`, () => {
  it('renders the heading as a level-two heading', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 2,
      name: MOCK_CTA_HEADING,
    });

    expect(heading).toBeVisible();
  });

  it('assigns headingId to the heading element', () => {
    setup({ headingId: MOCK_HEADING_ID });

    const heading = screen.getByRole('heading', { name: MOCK_CTA_HEADING });

    expect(heading).toHaveAttribute('id', MOCK_HEADING_ID);
  });

  it('renders the eyebrow slot', () => {
    setup({ children: <CtaModule.Eyebrow>{MOCK_EYEBROW}</CtaModule.Eyebrow> });

    const eyebrow = screen.getByText(MOCK_EYEBROW);

    expect(eyebrow).toBeVisible();
  });

  it('renders the supporting text and the content of the text slot', () => {
    setup({
      children: (
        <CtaModule.Text supportingText={MOCK_SUPPORTING_TEXT}>
          <p>{MOCK_CONTENT}</p>
        </CtaModule.Text>
      ),
    });

    const supportingText = screen.getByText(MOCK_SUPPORTING_TEXT);
    const content = screen.getByText(MOCK_CONTENT);

    expect(supportingText).toBeVisible();
    expect(content).toBeVisible();
  });

  it('renders the actions slot', () => {
    setup({
      children: (
        <CtaModule.Actions>
          <a href={MOCK_ACTION_PATH}>{MOCK_ACTION_LABEL}</a>
        </CtaModule.Actions>
      ),
    });

    const action = screen.getByRole('link', { name: MOCK_ACTION_LABEL });

    expect(action).toHaveAttribute('href', MOCK_ACTION_PATH);
  });

  it('renders the footnote slot', () => {
    setup({
      children: <CtaModule.Footnote>{MOCK_FOOTNOTE}</CtaModule.Footnote>,
    });

    const footnote = screen.getByText(MOCK_FOOTNOTE);

    expect(footnote).toBeVisible();
  });

  it('renders the media slot', () => {
    setup({
      children: <CtaModule.Media>{mockCtaTestImage()}</CtaModule.Media>,
    });

    const image = screen.getByTestId(MOCK_CTA_IMAGE_TEST_ID);

    expect(image).toBeVisible();
  });

  it('renders a child that matches no slot', () => {
    setup({ children: <p>{MOCK_UNMATCHED}</p> });

    const unmatched = screen.getByText(MOCK_UNMATCHED);

    expect(unmatched).toBeVisible();
  });
});
