import { customRender, screen } from '@web/testing/custom-render';
import { MOCK_POST_LIST_HEADING } from '@web/testing/modules/post-list/fixtures';
import {
  MOCK_LATEST_POSTS_SUPPORTING_TEXT,
  mockHeadingBlock,
} from '@web/testing/shared/heading-block/fixtures';

import { ModuleHeading } from './module-heading';

const HEADING_ID = 'section-title';

const setup = customRender(ModuleHeading, {
  headingBlock: mockHeadingBlock({ heading: MOCK_POST_LIST_HEADING }),
  id: HEADING_ID,
  level: 2,
  align: undefined,
});

describe(`<${ModuleHeading.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the authored heading text at the given level and id', () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_POST_LIST_HEADING,
      });

      expect(heading).toHaveAttribute('id', HEADING_ID);
    });

    it('renders no supporting text paragraph when supportingText is absent', () => {
      const paragraph = screen.queryByText(/./, { selector: 'p' });

      expect(paragraph).not.toBeInTheDocument();
    });
  });

  it('renders the heading tag at the given level', () => {
    setup({ level: 3 });

    const heading = screen.getByRole('heading', {
      level: 3,
      name: MOCK_POST_LIST_HEADING,
    });

    expect(heading).toBeVisible();
  });

  it('renders the supporting text when given', () => {
    setup({
      headingBlock: mockHeadingBlock({
        supportingText: MOCK_LATEST_POSTS_SUPPORTING_TEXT,
      }),
    });

    const supportingText = screen.getByText(MOCK_LATEST_POSTS_SUPPORTING_TEXT);

    expect(supportingText).toBeVisible();
  });
});
