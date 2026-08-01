import { ASIDE_KIND } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';

import { DeepAside } from './deep-aside';

const setup = customRender(DeepAside, {
  kind: ASIDE_KIND.WHY_NOT,
  label: 'Why not X',
  children: <p>Because Y.</p>,
});

// The DEEP-only visibility gate is pure presentation (a static Tailwind
// class pair, never data/state-driven from this component's own props) —
// no unit-test surface per `testing-practices`; covered visually via
// `BlogPostPage`'s depth-toggle behaviour and Storybook, not a class
// assertion here.
describe(`<${DeepAside.name}/>`, () => {
  it('renders the Aside molecule with its label and content', () => {
    setup();

    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByText('Why not X')).toBeVisible();
    expect(screen.getByText('Because Y.')).toBeVisible();
  });
});
