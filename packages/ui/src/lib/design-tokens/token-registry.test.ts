import { tokensByCategory } from './token-registry';

describe('token-registry', () => {
  it('groups the real theme.css color tokens, including brand-primary-solid and primary', () => {
    const names = tokensByCategory.color.map((t) => t.name);
    expect(names).toContain('brand-primary-solid');
    expect(names).toContain('primary');
  });

  it("resolves primary's role to 'page background'", () => {
    const primary = tokensByCategory.color.find((t) => t.name === 'primary');
    expect(primary?.role).toBe('page background');
  });

  it('discovers the xl typography token', () => {
    const names = tokensByCategory.typography.map((t) => t.name);
    expect(names).toContain('xl');
  });

  it('discovers the sm radius token', () => {
    const names = tokensByCategory.radius.map((t) => t.name);
    expect(names).toContain('sm');
  });
});
