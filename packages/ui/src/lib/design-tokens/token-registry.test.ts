import { tokensByCategory } from './token-registry';

describe('tokensByCategory', () => {
  it.each(['color', 'typography', 'font', 'radius', 'spacing'] as const)(
    'loads %s tokens from the real theme stylesheet',
    (category) => {
      const tokens = tokensByCategory[category];

      expect(tokens.length).toBeGreaterThan(0);
    },
  );
});
