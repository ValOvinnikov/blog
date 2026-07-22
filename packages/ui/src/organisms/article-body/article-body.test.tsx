import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { ArticleBody } from './article-body';

faker.seed(123);

describe(`<${ArticleBody.name}/>`, () => {
  it('renders children', () => {
    render(
      <ArticleBody>
        <p>Post body content.</p>
      </ArticleBody>,
    );
    expect(screen.getByText('Post body content.')).toBeVisible();
  });

  it('forwards dataTestId to the root element', () => {
    render(
      <ArticleBody dataTestId="article-body">
        <p>Post body content.</p>
      </ArticleBody>,
    );
    expect(screen.getByTestId('article-body')).toBeVisible();
  });
});
