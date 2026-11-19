import { tv } from './tv';

const FOCUS_RING_SHADOW = 'shadow-platform-focus-ring';
const INSET_FOCUS_RING_SHADOW = 'inset-shadow-platform-focus-ring';

describe(tv, () => {
  it('keeps a platform text size alongside a platform text colour', () => {
    const variants = tv({ base: 'text-platform-13 text-platform-muted' });

    expect(variants()).toBe('text-platform-13 text-platform-muted');
  });

  it('keeps a custom text size alongside a text colour in the same slot', () => {
    const variants = tv({
      slots: {
        label: ['text-label font-bold text-platform-faint'],
      },
    });

    const classes = variants().label();

    expect(classes).toContain('text-label');
    expect(classes).toContain('text-platform-faint');
  });

  it('keeps a platform border width alongside a platform border colour', () => {
    const variants = tv({
      base: 'border-platform-ring border-platform-control-line',
    });

    expect(variants()).toBe(
      'border-platform-ring border-platform-control-line',
    );
  });

  it('keeps a platform shadow beside a shadow colour and replaces an earlier radius', () => {
    const variants = tv({ base: 'rounded-platform shadow-platform' });

    const classes = variants({
      class: 'rounded-platform-control shadow-black',
    });

    expect(classes).toBe(
      'shadow-platform rounded-platform-control shadow-black',
    );
  });

  it('replaces an earlier inset shadow with the inset focus ring', () => {
    const variants = tv({ base: 'inset-shadow-sm' });

    expect(variants({ class: INSET_FOCUS_RING_SHADOW })).toBe(
      INSET_FOCUS_RING_SHADOW,
    );
  });

  it('replaces an earlier platform shadow with the focus ring', () => {
    const variants = tv({ base: 'shadow-platform' });

    expect(variants({ class: FOCUS_RING_SHADOW })).toBe(FOCUS_RING_SHADOW);
  });
});
