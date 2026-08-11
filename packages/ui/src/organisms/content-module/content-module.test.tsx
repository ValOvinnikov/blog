import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { ContentModule } from './content-module';

faker.seed(123);

const setup = customRender(ContentModule, {
  title: faker.lorem.sentence(3),
  titleId: 'content-title',
  children: <p>{faker.lorem.paragraph()}</p>,
});

describe(`<${ContentModule.name}/>`, () => {
  it('renders the title as a heading', () => {
    const title = faker.lorem.sentence(4);
    setup({ title, titleId: 'content-module-title' });

    expect(screen.getByRole('heading', { name: title })).toBeVisible();
  });

  it('renders the children content', () => {
    const body = faker.lorem.paragraph();
    setup({ children: <p>{body}</p> });

    expect(screen.getByText(body)).toBeVisible();
  });

  it('does not render a heading when title is omitted', () => {
    setup({ title: undefined, titleId: undefined });

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('assigns titleId to the heading element', () => {
    const title = faker.lorem.sentence(4);
    setup({ title, titleId: 'content-module-title' });

    expect(screen.getByRole('heading', { name: title })).toHaveAttribute(
      'id',
      'content-module-title',
    );
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: 'content-module' });

    expect(screen.getByTestId('content-module')).toBeVisible();
  });
});
