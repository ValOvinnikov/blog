import { portableTextToPlainText } from './portable-text-to-plain-text';
import type { TVoicePortableText } from './voice-portable-text';

describe(portableTextToPlainText, () => {
  it('joins a single block into plain text', () => {
    const value: TVoicePortableText = [
      {
        _type: 'block',
        _key: 'a',
        style: 'normal',
        children: [{ _type: 'span', _key: 'a1', text: 'Hello world.' }],
      },
    ];

    expect(portableTextToPlainText(value)).toBe('Hello world.');
  });

  it('drops mark formatting and keeps only the text', () => {
    const value: TVoicePortableText = [
      {
        _type: 'block',
        _key: 'a',
        style: 'normal',
        children: [
          { _type: 'span', _key: 'a1', text: 'Bold', marks: ['strong'] },
          { _type: 'span', _key: 'a2', text: ' and plain' },
        ],
      },
    ];

    expect(portableTextToPlainText(value)).toBe('Bold and plain');
  });

  it('joins multiple blocks with a single space', () => {
    const value: TVoicePortableText = [
      {
        _type: 'block',
        _key: 'a',
        style: 'normal',
        children: [{ _type: 'span', _key: 'a1', text: 'First.' }],
      },
      {
        _type: 'block',
        _key: 'b',
        style: 'normal',
        children: [{ _type: 'span', _key: 'b1', text: 'Second.' }],
      },
    ];

    expect(portableTextToPlainText(value)).toBe('First. Second.');
  });

  it('returns an empty string for an empty value', () => {
    expect(portableTextToPlainText([])).toBe('');
  });

  it('returns an empty string for undefined', () => {
    expect(portableTextToPlainText(undefined)).toBe('');
  });
});
