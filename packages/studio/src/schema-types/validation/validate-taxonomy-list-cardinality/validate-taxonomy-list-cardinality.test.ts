import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import {
  validateHasTaxonomyListModule,
  validateSingleTaxonomyListModule,
} from '@blog/studio/schema-types/validation/validate-taxonomy-list-cardinality/validate-taxonomy-list-cardinality';
import type { SanityDocument } from 'sanity';

type TModuleReference = { _type: string; _ref: string };

const buildDocument = (
  modules: TModuleReference[],
): SanityDocument & { modules: TModuleReference[] } => ({
  _id: 'doc-1',
  _type: 'page_topicIndex',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  _rev: 'rev-1',
  modules,
});

describe(validateSingleTaxonomyListModule, () => {
  it('passes with no modules', () => {
    expect(validateSingleTaxonomyListModule(undefined)).toBe(true);
  });

  it('passes with exactly one taxonomy list module', () => {
    expect(
      validateSingleTaxonomyListModule(
        buildDocument([{ _type: taxonomyListSchema.name, _ref: 'list-1' }]),
      ),
    ).toBe(true);
  });

  it('errors when more than one taxonomy list module is referenced', () => {
    expect(
      validateSingleTaxonomyListModule(
        buildDocument([
          { _type: taxonomyListSchema.name, _ref: 'list-1' },
          { _type: taxonomyListSchema.name, _ref: 'list-2' },
        ]),
      ),
    ).toBe('Only one Taxonomy List module is allowed per page.');
  });

  it('ignores modules of other types', () => {
    expect(
      validateSingleTaxonomyListModule(
        buildDocument([
          { _type: 'module_cta', _ref: 'cta-1' },
          { _type: 'module_cta', _ref: 'cta-2' },
        ]),
      ),
    ).toBe(true);
  });
});

describe(validateHasTaxonomyListModule, () => {
  const warning = 'This page has no Taxonomy List module.';

  it('warns with the supplied message when no module is referenced', () => {
    expect(validateHasTaxonomyListModule(warning)(buildDocument([]))).toBe(
      warning,
    );
  });

  it('passes when a taxonomy list module is referenced', () => {
    expect(
      validateHasTaxonomyListModule(warning)(
        buildDocument([{ _type: taxonomyListSchema.name, _ref: 'list-1' }]),
      ),
    ).toBe(true);
  });
});
