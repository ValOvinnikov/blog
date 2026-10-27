import { ASIDE_KIND } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Aside } from './aside';

faker.seed(123);

const MOCK_LABEL = faker.lorem.words(3);
const MOCK_BODY = faker.lorem.paragraph();

const setup = customRender(Aside, {
  kind: ASIDE_KIND.DIGRESSION,
  label: MOCK_LABEL,
  children: <p>{MOCK_BODY}</p>,
});

describe(`<${Aside.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('renders a note landmark named after the supplied label', () => {
    const note = screen.getByRole('note', { name: MOCK_LABEL });

    expect(note).toBeVisible();
  });

  it('renders the label as visible text', () => {
    const label = screen.getByText(MOCK_LABEL);

    expect(label).toBeVisible();
  });

  it('renders the given children', () => {
    const body = screen.getByText(MOCK_BODY);

    expect(body).toBeVisible();
  });
});
