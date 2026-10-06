import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawTaxonomyListModule } from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { localizedStrings } from '@blog/service/testing/shared/localized';
import {
  toIds,
  translatedPostDocuments,
} from '@blog/service/testing/shared/translated-posts-dataset';

import { taxonomyListModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const moduleDocument = {
  _id: 'module-1',
  _type: 'module_taxonomyList',
  brandVariant: 'PRIMARY',
  headingBlock: {
    _type: 'moduleHeadingBlock',
    heading: localizedStrings({
      [EN]: 'Latest posts',
      [NL]: 'Nieuwste berichten',
    }),
  },
  taxonomy: 'TOPICS',
};

async function runTaxonomyList(locale: string) {
  const raw = await evaluateGroqExpression(
    taxonomyListModuleQuery.query,
    [moduleDocument],
    undefined,
    { id: 'module-1', locale, defaultLocale: EN },
  );

  return taxonomyListModuleQuery.parse(raw);
}

describe('taxonomyListModuleQuery', () => {
  it('filters to module_taxonomyList documents by id', () => {
    expect(taxonomyListModuleQuery.query).toContain(
      '_type == "module_taxonomyList"',
    );
    expect(taxonomyListModuleQuery.query).toContain('_id == $id');
  });

  it('does not project an emptyMessage field', () => {
    expect(taxonomyListModuleQuery.query).not.toContain('emptyMessage');
  });

  it('parses a module with no layout set', () => {
    const raw = makeRawTaxonomyListModule({ layout: null });

    expect(() => taxonomyListModuleQuery.parse(raw)).not.toThrow();
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawTaxonomyListModule(), headingBlock: null };

    expect(() => taxonomyListModuleQuery.parse(raw)).toThrow();
  });

  it('projects contentAlignment', () => {
    expect(taxonomyListModuleQuery.query).toContain('contentAlignment');
  });

  it('resolves taxonomy from the authored field, with no coalesce/fallback', () => {
    expect(taxonomyListModuleQuery.query).not.toContain('coalesce(taxonomy');
    expect(taxonomyListModuleQuery.query).not.toContain('fallbackTaxonomy');
  });

  it('defaults sortOrder to ALPHABETICAL at read time', () => {
    expect(taxonomyListModuleQuery.query).toContain(
      'coalesce(sortOrder, "ALPHABETICAL")',
    );
  });

  it('selects topic entries or tag entries by the authored taxonomy', () => {
    expect(taxonomyListModuleQuery.query).toContain('taxonomy == "TOPICS"');
    expect(taxonomyListModuleQuery.query).toContain('taxonomy == "TAGS"');
    expect(taxonomyListModuleQuery.query).toContain('_type == "blog_topic"');
    expect(taxonomyListModuleQuery.query).toContain('_type == "blog_tag"');
  });

  it('defaults showLatestPosts to true at read time', () => {
    expect(taxonomyListModuleQuery.query).toContain(
      'coalesce(showLatestPosts, true)',
    );
  });

  it('projects only the id, heading and slug for each latest post', () => {
    expect(taxonomyListModuleQuery.query).toContain('"slug": slug.current');
    expect(taxonomyListModuleQuery.query).not.toContain('wordCount');
  });
  it('picks the heading in the visitor language', async () => {
    const { headingBlock } = await runTaxonomyList(NL);

    expect(headingBlock.heading).toBe('Nieuwste berichten');
  });

  it('falls back to the default language for the heading', async () => {
    const { headingBlock } = await runTaxonomyList(FR);

    expect(headingBlock.heading).toBe('Latest posts');
  });
});

describe('taxonomyListModuleQuery language scoping', () => {
  async function runEntry(locale: string) {
    const raw = (await evaluateGroqExpression(
      taxonomyListModuleQuery.query,
      [moduleDocument, ...translatedPostDocuments],
      undefined,
      { id: 'module-1', locale, defaultLocale: EN },
    )) as { entries: { postCount: number; latestPosts: unknown }[] };
    const [entry] = raw.entries;
    if (!entry) throw new Error('expected a topic entry');

    return { postCount: entry.postCount, latest: toIds(entry.latestPosts) };
  }

  it('counts and lists only published posts in the request language, newest first', async () => {
    expect(await runEntry(EN)).toEqual({
      postCount: 3,
      latest: ['only-en', 'design-en'],
    });
    expect(await runEntry(NL)).toEqual({
      postCount: 1,
      latest: ['design-nl'],
    });
  });
});
