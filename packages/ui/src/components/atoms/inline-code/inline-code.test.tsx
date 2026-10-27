import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { InlineCode } from './inline-code';

faker.seed(123);

const MOCK_TOKEN = faker.hacker.noun();

const setup = customRender(InlineCode, { children: MOCK_TOKEN });

describe(`<${InlineCode.name}/>`, () => {
  it('renders its children as code', () => {
    setup();

    const code = screen.getByRole('code');

    expect(code).toHaveTextContent(MOCK_TOKEN);
  });
});
