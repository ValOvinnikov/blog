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
  it('renders a note landmark named after the caller-supplied label', () => {
    setup();
    expect(screen.getByRole('note', { name: label })).toBeVisible();
  });

  it('renders the label as visible text', () => {
    setup();
    expect(screen.getByText(label)).toBeVisible();
  });

  it('never hardcodes the label — a different label renders as given', () => {
    const customLabel = 'Why not use a queue here?';
    setup({ kind: ASIDE_KIND.WHY_NOT, label: customLabel });
    expect(screen.getByRole('note', { name: customLabel })).toBeVisible();
  });

  it('renders the given children', () => {
    setup();
    expect(screen.getByText(body)).toBeVisible();
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

  it('accepts a className override on the root', () => {
    setup({ className: 'custom-class' });
    expect(screen.getByRole('note')).toHaveClass('custom-class');
  });
});
