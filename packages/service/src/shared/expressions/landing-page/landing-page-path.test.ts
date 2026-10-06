import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import {
  LANDING_PAGE_PATH_EXPRESSION,
  PAGE_PATH_EXPRESSION,
} from './landing-page-path';

function landing(id: string, slug: string | null, parent?: string) {
  return {
    _id: id,
    _type: 'page_landing',
    ...(slug ? { slug: { current: slug } } : {}),
    ...(parent ? { parent: { _type: 'reference', _ref: parent } } : {}),
  };
}

const dataset = [
  landing('modules', 'modules'),
  landing('faq', 'faq', 'modules'),
  landing('answers', 'answers', 'faq'),
  landing('too-deep', 'too-deep', 'answers'),
  landing('orphan', 'orphan', 'deleted'),
  landing('slugless', null),
  landing('under-slugless', 'under-slugless', 'slugless'),
  { _id: 'post', _type: 'page_post', slug: { current: 'hello' } },
];

function resolvePath(id: string, expression: string): Promise<unknown> {
  return evaluateGroqExpression(
    `*[_id == $id][0]{ "path": ${expression} }.path`,
    dataset,
    null,
    { id },
  );
}

describe('LANDING_PAGE_PATH_EXPRESSION', () => {
  it.each([
    ['modules', 'modules'],
    ['faq', 'modules/faq'],
    ['answers', 'modules/faq/answers'],
  ])('resolves %s to its full path', async (id, path) => {
    expect(await resolvePath(id, LANDING_PAGE_PATH_EXPRESSION)).toBe(path);
  });

  it.each(['too-deep', 'orphan', 'under-slugless'])(
    'resolves no path for %s',
    async (id) => {
      expect(await resolvePath(id, LANDING_PAGE_PATH_EXPRESSION)).toBeNull();
    },
  );
});

describe('PAGE_PATH_EXPRESSION', () => {
  it('resolves a landing page to its full path', async () => {
    expect(await resolvePath('faq', PAGE_PATH_EXPRESSION)).toBe('modules/faq');
  });

  it('resolves any other page to its slug', async () => {
    expect(await resolvePath('post', PAGE_PATH_EXPRESSION)).toBe('hello');
  });
});
