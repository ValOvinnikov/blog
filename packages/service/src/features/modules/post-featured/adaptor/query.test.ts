import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawPostFeaturedModule } from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { localizedStrings } from '@blog/service/testing/shared/localized';

import { postFeaturedModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const moduleDocument = {
  _id: 'module-1',
  _type: 'module_postFeatured',
  brandVariant: 'PRIMARY',
  headingBlock: {
    _type: 'moduleHeadingBlock',
    heading: localizedStrings({
      [EN]: 'Latest posts',
      [NL]: 'Nieuwste berichten',
    }),
  },
  postSource: 'PINNED',
  posts: [],
};

async function runPostFeatured(locale: string) {
  const raw = await evaluateGroqExpression(
    postFeaturedModuleQuery.query,
    [moduleDocument],
    undefined,
    { id: 'module-1', locale, defaultLocale: EN },
  );

  return postFeaturedModuleQuery.parse(raw);
}

describe('postFeaturedModuleQuery', () => {
  it('filters to module_postFeatured documents by id', () => {
    expect(postFeaturedModuleQuery.query).toContain(
      '_type == "module_postFeatured"',
    );
    expect(postFeaturedModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawPostFeaturedModule(), headingBlock: null };

    expect(() => postFeaturedModuleQuery.parse(raw)).toThrow();
  });

  it('derefs pinned posts and drops unpublished ones, preserving authored order', () => {
    expect(postFeaturedModuleQuery.query).toContain('postSource == "PINNED"');
    expect(postFeaturedModuleQuery.query).toContain('posts[]->');
    expect(postFeaturedModuleQuery.query).toContain('publishedAt <= now()');
  });

  it('falls back to the newest featured, published posts capped at 3', () => {
    expect(postFeaturedModuleQuery.query).toContain(
      '_type == "page_post"][featured == true][publishedAt <= now()',
    );
    expect(postFeaturedModuleQuery.query).toContain(
      'order(publishedAt desc)[0...3]',
    );
  });

  it('projects postSource and limit', () => {
    expect(postFeaturedModuleQuery.query).toContain('postSource');
    expect(postFeaturedModuleQuery.query).toContain('limit');
  });

  it('coalesces showImages to true for documents authored before the field existed', () => {
    expect(postFeaturedModuleQuery.query).toContain(
      'coalesce(showImages, true)',
    );
  });

  it('coalesces displayMode to GRID for documents authored before the field existed', () => {
    expect(postFeaturedModuleQuery.query).toContain(
      'coalesce(displayMode, "GRID")',
    );
  });
  it('picks the heading in the visitor language', async () => {
    const { headingBlock } = await runPostFeatured(NL);

    expect(headingBlock.heading).toBe('Nieuwste berichten');
  });

  it('falls back to the default language for the heading', async () => {
    const { headingBlock } = await runPostFeatured(FR);

    expect(headingBlock.heading).toBe('Latest posts');
  });
});
