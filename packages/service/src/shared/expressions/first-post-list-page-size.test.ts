import { evaluate, parse } from 'groq-js';

import {
  FIRST_POST_LIST_PAGE_SIZE_EXPRESSION,
  firstPostListPageSizeParser,
} from './first-post-list-page-size';

const dataset = [
  { _id: 'post-list-a', _type: 'module_postList', pageSize: 7 },
  { _id: 'hero-a', _type: 'module_hero' },
];

async function evaluateExpression(root: unknown): Promise<unknown> {
  const value = await evaluate(parse(FIRST_POST_LIST_PAGE_SIZE_EXPRESSION), {
    root,
    dataset,
  });

  return value.get();
}

describe('FIRST_POST_LIST_PAGE_SIZE_EXPRESSION', () => {
  it('returns the page size when module_postList is first', async () => {
    const root = {
      modules: [
        { _type: 'reference', _ref: 'post-list-a' },
        { _type: 'reference', _ref: 'hero-a' },
      ],
    };

    expect(
      firstPostListPageSizeParser.parse(await evaluateExpression(root)),
    ).toBe(7);
  });

  it('returns the page size when module_postList is second', async () => {
    const root = {
      modules: [
        { _type: 'reference', _ref: 'hero-a' },
        { _type: 'reference', _ref: 'post-list-a' },
      ],
    };

    expect(
      firstPostListPageSizeParser.parse(await evaluateExpression(root)),
    ).toBe(7);
  });

  it('returns null when there is no module_postList', async () => {
    const root = {
      modules: [{ _type: 'reference', _ref: 'hero-a' }],
    };

    expect(
      firstPostListPageSizeParser.parse(await evaluateExpression(root)),
    ).toBeNull();
  });

  it('returns null when modules is empty', async () => {
    const root = { modules: [] };

    expect(
      firstPostListPageSizeParser.parse(await evaluateExpression(root)),
    ).toBeNull();
  });

  it('returns null when modules is unset', async () => {
    const root = {};

    expect(
      firstPostListPageSizeParser.parse(await evaluateExpression(root)),
    ).toBeNull();
  });
});
