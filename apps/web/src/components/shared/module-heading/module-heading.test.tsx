import { customRender, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { ModuleHeading } from './module-heading';

const setup = customRender(ModuleHeading, {
  headingBlock: makeHeadingBlock({ heading: 'Latest posts' }),
  id: 'section-title',
  level: 2,
  align: undefined,
});

describe(`<${ModuleHeading.name}/>`, () => {
  it('renders the authored heading text at the given level and id', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Latest posts',
    });
    expect(heading).toHaveAttribute('id', 'section-title');
  });

  it('renders the heading tag at the given level', () => {
    setup({ level: 3 });

    expect(
      screen.getByRole('heading', { level: 3, name: 'Latest posts' }),
    ).toBeInTheDocument();
  });

  it('renders no supporting text paragraph when supportingText is absent', () => {
    setup();

    expect(screen.queryByText(/./, { selector: 'p' })).not.toBeInTheDocument();
  });

  it('renders the supporting text when given', () => {
    setup({
      headingBlock: makeHeadingBlock({
        supportingText: 'Fresh from the blog.',
      }),
    });

    expect(screen.getByText('Fresh from the blog.')).toBeVisible();
  });
});
