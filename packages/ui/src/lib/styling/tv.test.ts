import { tv } from './tv';

describe(tv, () => {
  it('resolves conflicting font-family utilities so the last one wins', () => {
    const styles = tv({ base: 'font-display' });
    expect(styles({ class: 'font-mono' })).toBe('font-mono');
  });

  it('resolves conflicting font-family utilities regardless of order', () => {
    const styles = tv({ base: 'font-mono' });
    expect(styles({ class: 'font-display' })).toBe('font-display');
  });

  it('resolves conflicts across all custom font-family utilities', () => {
    const styles = tv({ base: 'font-body' });
    expect(styles({ class: 'font-read' })).toBe('font-read');
  });
});
