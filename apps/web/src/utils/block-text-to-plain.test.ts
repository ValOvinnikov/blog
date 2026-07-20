import type { BlockText } from '@blog/config';
import { describe, expect, it } from 'vitest';

import { blockTextToPlain } from './block-text-to-plain';

function block(text: string): BlockText[number] {
  return {
    _type: 'block',
    _key: 'k1',
    style: 'normal',
    children: [{ _type: 'span', _key: 'c1', text }],
  };
}

describe(blockTextToPlain, () => {
  it('returns undefined for undefined input', () => {
    expect(blockTextToPlain(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty array', () => {
    expect(blockTextToPlain([])).toBeUndefined();
  });

  it('flattens a single block to plain text', () => {
    expect(blockTextToPlain([block('Hello world.')])).toBe('Hello world.');
  });

  it('joins multiple blocks with a space', () => {
    expect(blockTextToPlain([block('First.'), block('Second.')])).toBe(
      'First. Second.',
    );
  });

  it('concatenates multiple spans within a block', () => {
    const multiSpanBlock: BlockText[number] = {
      _type: 'block',
      _key: 'k1',
      style: 'normal',
      children: [
        { _type: 'span', _key: 'c1', text: 'Hello ' },
        { _type: 'span', _key: 'c2', text: 'world.' },
      ],
    };

    expect(blockTextToPlain([multiSpanBlock])).toBe('Hello world.');
  });

  it('returns undefined when all blocks are empty', () => {
    const emptyBlock: BlockText[number] = {
      _type: 'block',
      _key: 'k1',
      style: 'normal',
      children: [],
    };

    expect(blockTextToPlain([emptyBlock])).toBeUndefined();
  });
});
