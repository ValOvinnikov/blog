import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawPostListModule } from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { localizedStrings } from '@blog/service/testing/shared/localized';

import { postListModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const moduleDocument = {
  _id: 'module-1',
  _type: 'module_postList',
  brandVariant: 'PRIMARY',
  headingBlock: {
    _type: 'moduleHeadingBlock',
    heading: localizedStrings({
      [EN]: 'Latest posts',
      [NL]: 'Nieuwste berichten',
    }),
  },
  pageSize: 9,
};

async function runPostList(locale: string) {
  const raw = await evaluateGroqExpression(
    postListModuleQuery.query,
    [moduleDocument],
    undefined,
    { id: 'module-1', locale, defaultLocale: EN },
  );

  return postListModuleQuery.parse(raw);
}

describe('postListModuleQuery', () => {
  it('filters to module_postList documents by id', () => {
    expect(postListModuleQuery.query).toContain('_type == "module_postList"');
    expect(postListModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawPostListModule(), headingBlock: null };

    expect(() => postListModuleQuery.parse(raw)).toThrow();
  });

  it('projects the archive pageSize, not the retired limit field', () => {
    expect(postListModuleQuery.query).toContain('pageSize');
    expect(postListModuleQuery.query).not.toContain('limit');
  });

  it('projects contentAlignment', () => {
    expect(postListModuleQuery.query).toContain('contentAlignment');
  });

  it('coalesces showImages to true for documents authored before the field existed', () => {
    expect(postListModuleQuery.query).toContain('coalesce(showImages, true)');
  });
  it('picks the heading in the visitor language', async () => {
    const { headingBlock } = await runPostList(NL);

    expect(headingBlock.heading).toBe('Nieuwste berichten');
  });

  it('falls back to the default language for the heading', async () => {
    const { headingBlock } = await runPostList(FR);

    expect(headingBlock.heading).toBe('Latest posts');
  });
});
