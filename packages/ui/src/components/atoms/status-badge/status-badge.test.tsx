import { faker } from '@faker-js/faker';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';

import { StatusBadge } from './status-badge';

faker.seed(123);

const MOCK_LABEL = faker.word.adjective();

const setup = customRender(StatusBadge, { tone: 'ok', children: MOCK_LABEL });

describe(`<${StatusBadge.name}/>`, () => {
  it('renders the given text', () => {
    setup();

    const badge = screen.getByText(MOCK_LABEL);

    expect(badge).toBeVisible();
  });
});
