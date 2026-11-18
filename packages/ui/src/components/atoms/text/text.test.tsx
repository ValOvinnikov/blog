import { faker } from '@faker-js/faker';
import {
  DD_AS_CONST,
  DIV_AS_CONST,
  DT_AS_CONST,
  FIGCAPTION_AS_CONST,
  LI_AS_CONST,
  SPAN_AS_CONST,
} from '@shinefold/config';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';

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

  it.each([
    SPAN_AS_CONST,
    DIV_AS_CONST,
    DT_AS_CONST,
    DD_AS_CONST,
    LI_AS_CONST,
    FIGCAPTION_AS_CONST,
  ] as const)('renders children in a <%s> when as names it', (as) => {
    setup({ as });

    const element = screen.getByText(MOCK_BODY);

    expect(element.tagName).toBe(as.toUpperCase());
  });
});
