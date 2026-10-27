import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Text } from './text';

faker.seed(123);

const MOCK_BODY = faker.lorem.sentence();

const setup = customRender(Text, { children: MOCK_BODY });

describe(`<${Text.name}/>`, () => {
  it('renders children as a paragraph', () => {
    setup();

    const paragraph = screen.getByRole('paragraph');

    expect(paragraph).toHaveTextContent(MOCK_BODY);
  });
});
