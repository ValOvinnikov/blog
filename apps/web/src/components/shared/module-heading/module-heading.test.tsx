import { customRender, screen } from '@web/testing/custom-render';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { ModuleHeading } from './module-heading';

const HEADING = 'Latest posts';
const HEADING_ID = 'section-title';
const SUPPORTING_TEXT = 'Fresh from the blog.';

const setup = customRender(ModuleHeading, {
  headingBlock: mockHeadingBlock({ heading: HEADING }),
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
        name: HEADING,
      });
      expect(heading).toHaveAttribute('id', HEADING_ID);
    });

    it('renders no supporting text when the block has none', () => {
      const supportingText = screen.queryByText(/./, { selector: 'p' });
      expect(supportingText).not.toBeInTheDocument();
    });
  });

  it('renders the heading tag at the given level', () => {
    setup({ level: 3 });

    const heading = screen.getByRole('heading', { level: 3, name: HEADING });
    expect(heading).toBeVisible();
  });

  it('renders the supporting text when given', () => {
    setup({
      headingBlock: mockHeadingBlock({
        supportingText: SUPPORTING_TEXT,
      }),
    });

    const supportingText = screen.getByText(SUPPORTING_TEXT);
    expect(supportingText).toBeVisible();
  });
});
