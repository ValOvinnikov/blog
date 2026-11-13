import { tv } from './tv';

describe(tv, () => {
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

  it('keeps an admin shadow beside a shadow colour and replaces an earlier radius', () => {
    const variants = tv({ base: 'rounded-platform shadow-platform' });

    const classes = variants({
      class: 'rounded-platform-control shadow-black',
    });

    expect(classes).toBe(
      'shadow-platform rounded-platform-control shadow-black',
    );
  });
});
