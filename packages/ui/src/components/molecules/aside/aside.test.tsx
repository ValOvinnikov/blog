import { ASIDE_KIND } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Aside } from './aside';

faker.seed(123);

const label = 'Digression';
const body = faker.lorem.paragraph();

const setup = customRender(Aside, {
  kind: ASIDE_KIND.DIGRESSION,
  label,
  children: <p>{body}</p>,
});

describe(`<${Aside.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a note landmark named after the caller-supplied label', () => {
      expect(screen.getByRole('note', { name: label })).toBeVisible();
    });

    it('renders the label as visible text', () => {
      expect(screen.getByText(label)).toBeVisible();
    });

    it('renders the given children', () => {
      expect(screen.getByText(body)).toBeVisible();
    });
  });

  it('never hardcodes the label — a different label renders as given', () => {
    const customLabel = 'Why not use a queue here?';
    setup({ kind: ASIDE_KIND.WHY_NOT, label: customLabel });
    expect(screen.getByRole('note', { name: customLabel })).toBeVisible();
  });

  it('exposes the kind on a data-kind attribute for styling/testing hooks', () => {
    setup({ kind: ASIDE_KIND.CONTEXT });
    expect(screen.getByRole('note')).toHaveAttribute(
      'data-kind',
      ASIDE_KIND.CONTEXT,
    );
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'aside' });
    expect(screen.getByTestId('aside')).toBeVisible();
  });
});
