import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawPostLatestModule } from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { localizedStrings } from '@blog/service/testing/shared/localized';

import { postLatestModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const moduleDocument = {
  _id: 'module-1',
  _type: 'module_postLatest',
  brandVariant: 'PRIMARY',
  headingBlock: {
    _type: 'localizedHeadingBlock',
    heading: localizedStrings({
      [EN]: 'Latest posts',
      [NL]: 'Nieuwste berichten',
    }),
  },
  limit: 3,
};

async function runPostLatest(locale: string) {
  const raw = await evaluateGroqExpression(
    postLatestModuleQuery.query,
    [moduleDocument],
    undefined,
    { id: 'module-1', locale, defaultLocale: EN },
  );

  return postLatestModuleQuery.parse(raw);
}

describe('postLatestModuleQuery', () => {
  it('filters to module_postLatest documents by id', () => {
    expect(postLatestModuleQuery.query).toContain(
      '_type == "module_postLatest"',
    );
    expect(postLatestModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawPostLatestModule(), headingBlock: null };

    expect(() => postLatestModuleQuery.parse(raw)).toThrow();
  });

  it('projects contentAlignment', () => {
    expect(postLatestModuleQuery.query).toContain('contentAlignment');
  });

  it('coalesces showImages to true for documents authored before the field existed', () => {
    expect(postLatestModuleQuery.query).toContain('coalesce(showImages, true)');
  });

  it('coalesces displayMode to GRID for documents authored before the field existed', () => {
    expect(postLatestModuleQuery.query).toContain(
      'coalesce(displayMode, "GRID")',
    );
  });

  it('picks the heading in the visitor language', async () => {
    const { headingBlock } = await runPostLatest(NL);

    expect(headingBlock.heading).toBe('Nieuwste berichten');
  });

  it('falls back to the default language for the heading', async () => {
    const { headingBlock } = await runPostLatest(FR);

    expect(headingBlock.heading).toBe('Latest posts');
  });
});
