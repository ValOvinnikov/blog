import { customRender, screen } from '@web/testing/custom-render';

import { PageHeading } from './page-heading';

const setup = customRender(PageHeading, {
  headingBlock: {
    heading: 'Notes on building things',
    supportingText: undefined,
  },
  align: undefined,
});

describe(`<${PageHeading.name}/>`, () => {
  it('renders the heading as an h1', () => {
    setup();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Notes on building things',
      }),
    ).toBeVisible();
  });

  it('renders no supporting paragraph when supportingText is absent', () => {
    setup();

    expect(screen.queryByText(/./, { selector: 'p' })).not.toBeInTheDocument();
  });

  it('renders the supporting text when given', () => {
    setup({
      headingBlock: {
        heading: 'Notes on building things',
        supportingText: 'Essays and notes from the team.',
      },
    });

    expect(screen.getByText('Essays and notes from the team.')).toBeVisible();
  });
});
