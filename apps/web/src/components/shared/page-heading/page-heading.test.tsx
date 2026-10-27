import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { PageHeading } from './page-heading';

faker.seed(5201);

const MOCK_HEADING = faker.lorem.words(3);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();

const setup = customRender(PageHeading, {
  headingBlock: mockHeadingBlock({ heading: MOCK_HEADING }),
  align: undefined,
});

describe(`<${PageHeading.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the heading as an h1', () => {
      const heading = screen.getByRole('heading', {
        level: 1,
        name: MOCK_HEADING,
      });

      expect(heading).toBeVisible();
    });

    it('renders no supporting paragraph when supportingText is absent', () => {
      const paragraph = screen.queryByText(/./, { selector: 'p' });

      expect(paragraph).not.toBeInTheDocument();
    });
  });

  it('renders the supporting text when given', () => {
    setup({
      headingBlock: mockHeadingBlock({
        heading: MOCK_HEADING,
        supportingText: MOCK_SUPPORTING_TEXT,
      }),
    });

    const supportingText = screen.getByText(MOCK_SUPPORTING_TEXT);

    expect(supportingText).toBeVisible();
  });
});
