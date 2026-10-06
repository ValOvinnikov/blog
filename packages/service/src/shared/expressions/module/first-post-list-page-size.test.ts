import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import {
  FIRST_POST_LIST_PAGE_SIZE_EXPRESSION,
  firstPostListPageSizeParser,
} from './first-post-list-page-size';

const dataset = [
  { _id: 'post-list-a', _type: 'module_postList', pageSize: 7 },
  { _id: 'hero-a', _type: 'module_hero' },
];

const root = { template: { _type: 'reference', _ref: 'template-a' } };

async function evaluateExpression(
  template: Record<string, unknown>,
): Promise<unknown> {
  return evaluateGroqExpression(
    FIRST_POST_LIST_PAGE_SIZE_EXPRESSION,
    [...dataset, { _id: 'template-a', _type: 'template_tag', ...template }],
    root,
  );
}

describe('FIRST_POST_LIST_PAGE_SIZE_EXPRESSION', () => {
  it('returns the page size when module_postList is first', async () => {
    const template = {
      modules: [
        { _type: 'reference', _ref: 'post-list-a' },
        { _type: 'reference', _ref: 'hero-a' },
      ],
    };

    expect(
      firstPostListPageSizeParser.parse(await evaluateExpression(template)),
    ).toBe(7);
  });

  it('returns the page size when module_postList is second', async () => {
    const template = {
      modules: [
        { _type: 'reference', _ref: 'hero-a' },
        { _type: 'reference', _ref: 'post-list-a' },
      ],
    };

    expect(
      firstPostListPageSizeParser.parse(await evaluateExpression(template)),
    ).toBe(7);
  });

  it('returns null when there is no module_postList', async () => {
    const template = {
      modules: [{ _type: 'reference', _ref: 'hero-a' }],
    };

    expect(
      firstPostListPageSizeParser.parse(await evaluateExpression(template)),
    ).toBeNull();
  });

  it('returns null when the template has an empty modules list', async () => {
    const template = { modules: [] };

    expect(
      firstPostListPageSizeParser.parse(await evaluateExpression(template)),
    ).toBeNull();
  });

  it('returns null when the template has no modules', async () => {
    const template = {};

    expect(
      firstPostListPageSizeParser.parse(await evaluateExpression(template)),
    ).toBeNull();
  });
});
