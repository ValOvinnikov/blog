import { ASIDE_KIND } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';

import { DeepAside } from './deep-aside';

const setup = customRender(DeepAside, {
  kind: ASIDE_KIND.WHY_NOT,
  label: 'Why not X',
  children: <p>Because Y.</p>,
});

describe(`<${DeepAside.name}/>`, () => {
  it('renders the Aside molecule with its label and content', () => {
    setup();

    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByText('Why not X')).toBeVisible();
    expect(screen.getByText('Because Y.')).toBeVisible();
  });
});
