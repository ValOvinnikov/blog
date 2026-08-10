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

  // Guards the same class of bug as the font-family cases above: without the
  // custom `font-size` classGroup registration, tailwind-merge lumps custom
  // text-<size> utilities (text-copy, text-lead, ...) into the same conflict
  // group as custom text-<color> utilities (text-accent, text-accent-contrast,
  // ...) and silently drops one when both are applied to the same element.
  it('does not drop a text-<color> utility when a text-<size> utility is also applied', () => {
    const styles = tv({ base: 'text-copy' });
    expect(styles({ class: 'text-accent-contrast' })).toBe(
      'text-copy text-accent-contrast',
    );
  });

  it('does not drop a text-<size> utility when a text-<color> utility is also applied', () => {
    const styles = tv({ base: 'text-accent-contrast' });
    expect(styles({ class: 'text-copy' })).toBe(
      'text-accent-contrast text-copy',
    );
  });

  // Guards the same class of bug as the font-size/font-family cases above:
  // without the custom spacing classGroup registration, tailwind-merge has no
  // catch-all for padding utilities, so a custom py-<token> (py-section) and
  // the standard py-0 were classified as non-conflicting and both landed on
  // the element, leaving the winner up to stylesheet order instead of tv()'s
  // override intent.
  it('resolves a conflicting custom py-<token> utility so the last one wins', () => {
    const styles = tv({ base: 'py-section' });
    expect(styles({ class: 'py-0' })).toBe('py-0');
  });

  it('does not drop an unrelated px-<token> utility when a conflicting py utility is resolved', () => {
    const styles = tv({ base: 'py-section px-gutter' });
    expect(styles({ class: 'py-0' })).toBe('px-gutter py-0');
  });
});
