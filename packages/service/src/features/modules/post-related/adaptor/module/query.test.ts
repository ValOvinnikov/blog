import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawPostRelatedModule } from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { localizedStrings } from '@blog/service/testing/shared/localized';

import { postRelatedModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const moduleDocument = {
  _id: 'module-1',
  _type: 'module_postRelated',
  brandVariant: 'PRIMARY',
  headingBlock: {
    _type: 'moduleHeadingBlock',
    heading: localizedStrings({
      [EN]: 'Latest posts',
      [NL]: 'Nieuwste berichten',
    }),
  },
  limit: 3,
};

async function runPostRelated(locale: string) {
  const raw = await evaluateGroqExpression(
    postRelatedModuleQuery.query,
    [moduleDocument],
    undefined,
    { id: 'module-1', locale, defaultLocale: EN },
  );

  return postRelatedModuleQuery.parse(raw);
}

describe('postRelatedModuleQuery', () => {
  it('filters to module_postRelated documents by id', () => {
    expect(postRelatedModuleQuery.query).toContain(
      '_type == "module_postRelated"',
    );
    expect(postRelatedModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawPostRelatedModule(), headingBlock: null };

    expect(() => postRelatedModuleQuery.parse(raw)).toThrow();
  });

  it('projects brandVariant and limit', () => {
    expect(postRelatedModuleQuery.query).toContain('brandVariant');
    expect(postRelatedModuleQuery.query).toContain('limit');
  });

  it('coalesces showImages to true for documents authored before the field existed', () => {
    expect(postRelatedModuleQuery.query).toContain(
      'coalesce(showImages, true)',
    );
  });
  it('picks the heading in the visitor language', async () => {
    const { headingBlock } = await runPostRelated(NL);

    expect(headingBlock.heading).toBe('Nieuwste berichten');
  });

  it('falls back to the default language for the heading', async () => {
    const { headingBlock } = await runPostRelated(FR);

    expect(headingBlock.heading).toBe('Latest posts');
  });
});
