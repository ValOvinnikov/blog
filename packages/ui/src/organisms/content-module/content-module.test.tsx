import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { ContentModule } from './content-module';

faker.seed(123);

describe(`<${ContentModule.name}/>`, () => {
  it('renders the title as a heading', () => {
    const title = faker.lorem.sentence(4);
    render(
      <ContentModule title={title} titleId="content-module-title">
        <p>{faker.lorem.paragraph()}</p>
      </ContentModule>,
    );

    expect(screen.getByRole('heading', { name: title })).toBeVisible();
  });

  it('renders the children content', () => {
    const body = faker.lorem.paragraph();
    render(
      <ContentModule title={faker.lorem.sentence(3)} titleId="content-title">
        <p>{body}</p>
      </ContentModule>,
    );

    expect(screen.getByText(body)).toBeVisible();
  });

  it('does not render a heading when title is omitted', () => {
    render(
      <ContentModule>
        <p>{faker.lorem.paragraph()}</p>
      </ContentModule>,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('labels the section via the title heading when both are provided', () => {
    const title = faker.lorem.sentence(4);
    const { container } = render(
      <ContentModule title={title} titleId="content-module-title">
        <p>{faker.lorem.paragraph()}</p>
      </ContentModule>,
    );

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'content-module-title');
    expect(screen.getByRole('heading', { name: title })).toHaveAttribute(
      'id',
      'content-module-title',
    );
  });

  it('forwards data-testid', () => {
    render(
      <ContentModule
        title={faker.lorem.sentence(3)}
        titleId="content-title"
        dataTestId="content-module"
      >
        <p>{faker.lorem.paragraph()}</p>
      </ContentModule>,
    );

    expect(screen.getByTestId('content-module')).toBeVisible();
  });
});
