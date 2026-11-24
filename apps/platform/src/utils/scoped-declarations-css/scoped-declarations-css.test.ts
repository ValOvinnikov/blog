import { toScopedDeclarationsCss } from './scoped-declarations-css';

const SELECTOR = '[data-frame="a"] [data-skin]';

describe(toScopedDeclarationsCss, () => {
  it('declares every property inside the selector', () => {
    expect(
      toScopedDeclarationsCss(SELECTOR, {
        '--nav-link-fill': 'var(--surface)',
        '--nav-link-decoration': 'underline',
      }),
    ).toBe(
      `${SELECTOR} { --nav-link-fill: var(--surface); --nav-link-decoration: underline; }`,
    );
  });

  it('writes an empty rule when there is nothing to declare', () => {
    expect(toScopedDeclarationsCss(SELECTOR, {})).toBe(`${SELECTOR} {  }`);
  });
});
