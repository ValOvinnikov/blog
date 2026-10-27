import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { ContentModule } from './content-module';

faker.seed(123);

const MOCK_BODY = faker.lorem.paragraph();

const setup = customRender(ContentModule, {
  children: <p>{MOCK_BODY}</p>,
});

describe(`<${ContentModule.name}/>`, () => {
  it('renders the children content', () => {
    setup();

    const body = screen.getByText(MOCK_BODY);

    expect(body).toBeVisible();
  });
});
