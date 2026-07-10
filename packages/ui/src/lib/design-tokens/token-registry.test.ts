import { tokensByCategory } from './token-registry';

describe('token-registry', () => {
  it('groups the real theme.css color tokens, including accent-solid and bg', () => {
    const names = tokensByCategory.color.map((t) => t.name);
    expect(names).toContain('accent-solid');
    expect(names).toContain('bg');
  });

  it("resolves bg's role to 'page background'", () => {
    const bg = tokensByCategory.color.find((t) => t.name === 'bg');
    expect(bg?.role).toBe('page background');
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
