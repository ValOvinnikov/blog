import { BRAND_VARIANT, CONTENT_ALIGNMENT, CTA_VARIANT } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { CtaModule } from './cta-module';

faker.seed(123);

const CTA_IMAGE_TEST_ID = 'cta-image';
const MOCK_HEADING = faker.lorem.sentence(3);
const MOCK_HEADING_ID = faker.lorem.slug(2);
const MOCK_EYEBROW = faker.lorem.words(2);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence(8);
const MOCK_FOOTNOTE = faker.lorem.sentence(6);
const MOCK_CONTENT = faker.lorem.sentence(5);
const MOCK_ACTION_LABEL = faker.lorem.word();
const MOCK_ACTION_PATH = `/${faker.lorem.slug(1)}`;
const MOCK_IMAGE_SRC = faker.image.url();

const mockImage = () => (
  <img src={MOCK_IMAGE_SRC} alt="" data-testid={CTA_IMAGE_TEST_ID} />
);

const setup = customRender(CtaModule, {
  variant: CTA_VARIANT.CALLOUT,
  tone: BRAND_VARIANT.PRIMARY,
  heading: MOCK_HEADING,
});

describe(`<${CtaModule.name}/>`, () => {
  it('renders the heading', () => {
    setup();

    const heading = screen.getByRole('heading', { name: MOCK_HEADING });

    expect(heading).toBeVisible();
  });

  it('assigns headingId to the heading element', () => {
    setup({ headingId: MOCK_HEADING_ID });

    const heading = screen.getByRole('heading', { name: MOCK_HEADING });

    expect(heading).toHaveAttribute('id', MOCK_HEADING_ID);
  });

  it('renders the eyebrow when provided', () => {
    setup({ eyebrow: MOCK_EYEBROW });

    const eyebrow = screen.getByText(MOCK_EYEBROW);

    expect(eyebrow).toBeVisible();
  });

  it('renders supportingText when provided', () => {
    setup({ supportingText: MOCK_SUPPORTING_TEXT });

    const supportingText = screen.getByText(MOCK_SUPPORTING_TEXT);

    expect(supportingText).toBeVisible();
  });

  it('renders content when provided', () => {
    setup({ content: <p>{MOCK_CONTENT}</p> });

    const content = screen.getByText(MOCK_CONTENT);

    expect(content).toBeVisible();
  });

  it('renders the actions slot', () => {
    setup({
      actions: <a href={MOCK_ACTION_PATH}>{MOCK_ACTION_LABEL}</a>,
    });

    const action = screen.getByRole('link', { name: MOCK_ACTION_LABEL });

    expect(action).toHaveAttribute('href', MOCK_ACTION_PATH);
  });

  it('renders footnote when provided', () => {
    setup({ footnote: MOCK_FOOTNOTE });

    const footnote = screen.getByText(MOCK_FOOTNOTE);

    expect(footnote).toBeVisible();
  });

  it('renders the image when provided', () => {
    setup({ image: mockImage() });

    const image = screen.getByTestId(CTA_IMAGE_TEST_ID);

    expect(image).toBeVisible();
  });

  it.each([
    { variant: CTA_VARIANT.CALLOUT },
    { variant: CTA_VARIANT.SPLIT, contentPosition: CONTENT_ALIGNMENT.RIGHT },
    { variant: CTA_VARIANT.BANNER },
  ])('keeps the image after the heading in the DOM for $variant', (props) => {
    setup({ ...props, image: mockImage() });

    const heading = screen.getByRole('heading', { name: MOCK_HEADING });
    const image = screen.getByTestId(CTA_IMAGE_TEST_ID);

    expect(heading.compareDocumentPosition(image)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
