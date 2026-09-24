import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { ContentModule } from './content-module';

faker.seed(123);

const setup = customRender(ContentModule, {
  children: <p>{faker.lorem.paragraph()}</p>,
});

describe(`<${ContentModule.name}/>`, () => {
  it('renders the children content', () => {
    const body = faker.lorem.paragraph();
    setup({ children: <p>{body}</p> });

    expect(screen.getByText(body)).toBeVisible();
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: 'content-module' });

    expect(screen.getByTestId('content-module')).toBeVisible();
  });
});
