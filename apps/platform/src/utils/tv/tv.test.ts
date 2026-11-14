import { tv } from './tv';

const DROP_AND_INSET_SHADOW =
  'shadow-platform inset-shadow-platform-focus-ring';
const FOCUS_RING_SHADOW = 'shadow-platform-focus-ring';

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

  it('keeps a platform shadow beside a shadow colour and replaces an earlier radius', () => {
    const variants = tv({ base: 'rounded-platform shadow-platform' });

    const classes = variants({
      class: 'rounded-platform-control shadow-black',
    });

    expect(classes).toBe(
      'shadow-platform rounded-platform-control shadow-black',
    );
  });

  it('keeps an inset platform shadow beside a platform drop shadow', () => {
    const variants = tv({ base: DROP_AND_INSET_SHADOW });

    expect(variants()).toBe(DROP_AND_INSET_SHADOW);
  });

  it('replaces an earlier platform shadow with the focus ring', () => {
    const variants = tv({ base: 'shadow-platform' });

    expect(variants({ class: FOCUS_RING_SHADOW })).toBe(FOCUS_RING_SHADOW);
  });
});
