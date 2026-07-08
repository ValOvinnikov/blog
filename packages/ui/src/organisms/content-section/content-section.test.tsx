import { render, screen } from '@testing-library/react';

import { ContentSection } from './content-section';

describe(`<${ContentSection.name}/>`, () => {
  it('labels the section with its heading', () => {
    render(
      <ContentSection title="Latest" titleId="latest-posts">
        <p>Posts</p>
      </ContentSection>,
    );

    expect(screen.getByRole('region', { name: 'Latest' })).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Latest' }),
    ).toBeVisible();
  });

  it('forwards data-testid', () => {
    render(
      <ContentSection title="Latest" titleId="latest-posts" dataTestId="latest">
        <p>Posts</p>
      </ContentSection>,
    );

    expect(screen.getByTestId('latest')).toBeVisible();
  });
});
