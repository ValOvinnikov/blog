import { CONTENT_ALIGNMENT, SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import { MOCK_CONTENTS_RAIL_BODY } from '@web/testing/shared/contents-rail/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { stubFakeIntersectionObserver } from '@web/testing/shared/intersection-observer/fake-intersection-observer';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';

import { DocumentArticle } from './document-article';

faker.seed(6523);

vi.mock('@web/i18n/navigation');

const RAIL_NAME = SITE_MESSAGES.contentsRail.label;
const MOCK_HEADING = faker.lorem.words(3);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_PARAGRAPH = faker.lorem.sentence();

const setup = customRender(DocumentArticle, {
  headingBlock: mockHeadingBlock({
    heading: MOCK_HEADING,
    supportingText: MOCK_SUPPORTING_TEXT,
  }),
  headingAlignment: CONTENT_ALIGNMENT.LEFT,
  body: MOCK_CONTENTS_RAIL_BODY,
});

describe(`<${DocumentArticle.name}/>`, () => {
  beforeEach(() => {
    stubFakeIntersectionObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the heading block as the only page heading', () => {
      const headings = screen.getAllByRole('heading', { level: 1 });

      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent(MOCK_HEADING);
    });

    it('renders the supporting text', () => {
      const supportingText = screen.getByText(MOCK_SUPPORTING_TEXT);

      expect(supportingText).toBeVisible();
    });

    it('renders the body with the contents rail at three or more H2s', () => {
      const rail = screen.getByRole('navigation', { name: RAIL_NAME });

      expect(rail).toBeVisible();
    });
  });

  it('renders no page heading without a heading block', () => {
    setup({ headingBlock: undefined });
    const heading = screen.queryByRole('heading', { level: 1 });

    expect(heading).not.toBeInTheDocument();
  });

  it('renders the body without a rail below three H2s', () => {
    setup({ body: [mockPortableTextBlock(MOCK_PARAGRAPH)] });
    const paragraph = screen.getByText(MOCK_PARAGRAPH);
    const rail = screen.queryByRole('navigation', { name: RAIL_NAME });

    expect(paragraph).toBeVisible();
    expect(rail).not.toBeInTheDocument();
  });
});
