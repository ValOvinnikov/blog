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

  it('does not drop a text-<color> utility when a text-<size> utility is also applied, guarding against tailwind-merge lumping both into one conflict group and silently dropping one', () => {
    const styles = tv({ base: 'text-copy' });
    expect(styles({ class: 'text-brand-primary-contrast' })).toBe(
      'text-copy text-brand-primary-contrast',
    );
  });

  it('does not drop a text-<size> utility when a text-<color> utility is also applied', () => {
    const styles = tv({ base: 'text-brand-primary-contrast' });
    expect(styles({ class: 'text-copy' })).toBe(
      'text-brand-primary-contrast text-copy',
    );
  });

  it('resolves a conflicting custom py-<token> utility so the last one wins, guarding against tailwind-merge treating py-section and py-0 as non-conflicting with no padding catch-all', () => {
    const styles = tv({ base: 'py-section' });
    expect(styles({ class: 'py-0' })).toBe('py-0');
  });

  it('does not drop an unrelated px-<token> utility when a conflicting py utility is resolved', () => {
    const styles = tv({ base: 'py-section px-gutter' });
    expect(styles({ class: 'py-0' })).toBe('px-gutter py-0');
  });

  it('resolves a conflicting custom tracking-<token> utility so the last one wins, guarding against tailwind-merge treating tracking-tight and tracking-label as non-conflicting', () => {
    const styles = tv({ base: 'tracking-tight' });
    expect(styles({ class: 'tracking-label' })).toBe('tracking-label');
  });

  it('resolves conflicts across all custom tracking utilities', () => {
    const styles = tv({ base: 'tracking-eyebrow' });
    expect(styles({ class: 'tracking-tight-card' })).toBe(
      'tracking-tight-card',
    );
  });
});
