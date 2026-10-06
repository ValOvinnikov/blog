import { toPlainText } from '@blog/studio/schema-types/portable-text/to-plain-text/to-plain-text';

describe(toPlainText, () => {
  it('joins each block child text with a space and trims the result', () => {
    expect(
      toPlainText([
        { children: [{ text: 'Hello' }, { text: 'world' }] },
        { children: [{ text: '!' }] },
      ]),
    ).toBe('Hello world !');
  });

  it('returns an empty string for no blocks', () => {
    expect(toPlainText()).toBe('');
    expect(toPlainText([])).toBe('');
  });

  it('treats a block with no children as contributing no text', () => {
    expect(toPlainText([{}, { children: [{ text: 'Hi' }] }])).toBe('Hi');
  });

  it('treats a child with no text as an empty string', () => {
    expect(toPlainText([{ children: [{}, { text: 'there' }] }])).toBe('there');
  });
});
