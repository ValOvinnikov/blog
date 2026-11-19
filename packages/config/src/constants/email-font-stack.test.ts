import { EMAIL_FONT_STACK } from './email-font-stack';
import { FONT_CHOICE } from './preset';

const WEB_SAFE_GENERIC_FAMILIES = ['serif', 'sans-serif', 'monospace'];

describe('EMAIL_FONT_STACK', () => {
  it.each(Object.values(FONT_CHOICE))(
    'ends the %s stack in a web-safe generic family',
    (fontChoice) => {
      const lastFamily = EMAIL_FONT_STACK[fontChoice].split(',').at(-1)?.trim();

      expect(WEB_SAFE_GENERIC_FAMILIES).toContain(lastFamily);
    },
  );

  it('never uses a double quote, which would close an inline style attribute', () => {
    const quoted = Object.values(EMAIL_FONT_STACK).filter((stack) =>
      stack.includes('"'),
    );

    expect(quoted).toEqual([]);
  });
});
