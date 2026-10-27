import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { Text } from './text';

faker.seed(5995);

const MOCK_COPY = faker.lorem.sentence();

const setup = customRender(Text, { children: MOCK_COPY });

describe(`<${Text.name}/>`, () => {
  it('renders its content as a paragraph by default', () => {
    setup();

    const paragraph = screen.getByRole('paragraph');

    expect(paragraph).toBeVisible();
    expect(paragraph).toHaveTextContent(MOCK_COPY);
  });

  it('renders inline copy outside a paragraph', () => {
    setup({ as: 'span' });

    const text = screen.getByText(MOCK_COPY);
    const paragraph = screen.queryByRole('paragraph');

    expect(text).toBeVisible();
    expect(paragraph).not.toBeInTheDocument();
  });
});
