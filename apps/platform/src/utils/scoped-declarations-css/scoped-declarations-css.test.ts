import { toScopedDeclarationsCss } from './scoped-declarations-css';

const MOCK_SELECTOR = '[data-frame="a"] [data-skin]';

describe(toScopedDeclarationsCss, () => {
  it('declares every property inside the selector', () => {
    expect(
      toScopedDeclarationsCss(MOCK_SELECTOR, {
        '--nav-link-fill': 'var(--surface)',
        '--nav-link-decoration': 'underline',
      }),
    ).toBe(
      `${MOCK_SELECTOR} { --nav-link-fill: var(--surface); --nav-link-decoration: underline; }`,
    );
  });

  it('writes an empty rule when there is nothing to declare', () => {
    expect(toScopedDeclarationsCss(MOCK_SELECTOR, {})).toBe(
      `${MOCK_SELECTOR} {  }`,
    );
  });
});
