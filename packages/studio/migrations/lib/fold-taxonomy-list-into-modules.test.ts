import { at, prepend, setIfMissing } from 'sanity/migrate';

import {
  foldTaxonomyListIntoModules,
  toTaxonomyListModuleKey,
  type TTaxonomyListFoldSource,
} from './fold-taxonomy-list-into-modules';

describe(toTaxonomyListModuleKey, () => {
  it('derives a deterministic key from the ref', () => {
    expect(toTaxonomyListModuleKey('list-1')).toBe('taxonomyList-list-1');
    expect(toTaxonomyListModuleKey('list-1')).toBe(
      toTaxonomyListModuleKey('list-1'),
    );
  });
});

describe(foldTaxonomyListIntoModules, () => {
  it('inserts a module_taxonomyList item at index 0 when modules[] is absent', () => {
    const doc = { taxonomyList: { _ref: 'list-1' } };

    expect(foldTaxonomyListIntoModules(doc)).toEqual([
      at('modules', setIfMissing([])),
      at(
        'modules',
        prepend([
          {
            _key: toTaxonomyListModuleKey('list-1'),
            _type: 'module_taxonomyList',
            _ref: 'list-1',
          },
        ]),
      ),
    ]);
  });

  it('inserts before existing modules[] entries', () => {
    const doc = {
      taxonomyList: { _ref: 'list-1' },
      modules: [{ _key: 'k1', _type: 'module_cta', _ref: 'cta-1' }],
    };

    expect(foldTaxonomyListIntoModules(doc)).toEqual([
      at('modules', setIfMissing([])),
      at(
        'modules',
        prepend([
          {
            _key: toTaxonomyListModuleKey('list-1'),
            _type: 'module_taxonomyList',
            _ref: 'list-1',
          },
        ]),
      ),
    ]);
  });

  it('is a no-op when the reference is already in modules[]', () => {
    const doc = {
      taxonomyList: { _ref: 'list-1' },
      modules: [{ _key: 'k1', _type: 'module_taxonomyList', _ref: 'list-1' }],
    };

    expect(foldTaxonomyListIntoModules(doc)).toBeUndefined();
  });

  it('is a no-op, not an error, when there is no taxonomyList reference', () => {
    const doc = {} as TTaxonomyListFoldSource;

    expect(foldTaxonomyListIntoModules(doc)).toBeUndefined();
  });
});
