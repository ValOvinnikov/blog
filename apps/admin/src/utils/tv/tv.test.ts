import { tv } from './tv';

describe(tv, () => {
  it('keeps a custom text-size class when combined with a text-color class in the same slot', () => {
    const variants = tv({
      slots: {
        label: ['text-label font-bold text-admin-faint'],
      },
    });

    const classes = variants().label();

    expect(classes).toContain('text-label');
    expect(classes).toContain('text-admin-faint');
  });
});
