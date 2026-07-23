import { customRender, screen } from '@blog/ui/testing/custom-render';

import { ContentSection } from './content-section';

const setup = customRender(ContentSection, {
  title: 'Latest',
  titleId: 'latest-posts',
  children: <p>Posts</p>,
});

describe(`<${ContentSection.name}/>`, () => {
  it('labels the section with its heading', () => {
    setup();

    expect(screen.getByRole('region', { name: 'Latest' })).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Latest' }),
    ).toBeVisible();
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: 'latest' });

    expect(screen.getByTestId('latest')).toBeVisible();
  });
});
