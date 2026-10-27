import { faker } from '@faker-js/faker';
import { at, prepend, setIfMissing } from 'sanity/migrate';

import {
  foldTaxonomyListIntoModules,
  toTaxonomyListModuleKey,
} from './fold-taxonomy-list-into-modules';

faker.seed(11);

const MOCK_LIST_ID = faker.string.uuid();
const MOCK_OTHER_LIST_ID = faker.string.uuid();
const MOCK_CTA_ID = faker.string.uuid();
const TAXONOMY_LIST_MODULE_TYPE = 'module_taxonomyList';

const mockModule = (type: string, ref: string) => ({
  _key: faker.string.uuid(),
  _type: type,
  _ref: ref,
});

describe(toTaxonomyListModuleKey, () => {
  it('derives the same key from the same ref', () => {
    expect(toTaxonomyListModuleKey(MOCK_LIST_ID)).toBe(
      toTaxonomyListModuleKey(MOCK_LIST_ID),
    );
  });

  it('derives different keys from different refs', () => {
    expect(toTaxonomyListModuleKey(MOCK_LIST_ID)).not.toBe(
      toTaxonomyListModuleKey(MOCK_OTHER_LIST_ID),
    );
  });
});

describe(foldTaxonomyListIntoModules, () => {
  it.each([
    ['modules[] is absent', {}],
    [
      'modules[] has other entries',
      { modules: [mockModule('module_cta', MOCK_CTA_ID)] },
    ],
  ])('puts the taxonomy list module first when %s', (_label, extraFields) => {
    const doc = { taxonomyList: { _ref: MOCK_LIST_ID }, ...extraFields };

    expect(foldTaxonomyListIntoModules(doc)).toEqual([
      at('modules', setIfMissing([])),
      at(
        'modules',
        prepend([
          {
            _key: toTaxonomyListModuleKey(MOCK_LIST_ID),
            _type: TAXONOMY_LIST_MODULE_TYPE,
            _ref: MOCK_LIST_ID,
          },
        ]),
      ),
    ]);
  });

  it('leaves a document whose reference is already in modules[] untouched', () => {
    const doc = {
      taxonomyList: { _ref: MOCK_LIST_ID },
      modules: [mockModule(TAXONOMY_LIST_MODULE_TYPE, MOCK_LIST_ID)],
    };

    expect(foldTaxonomyListIntoModules(doc)).toBeUndefined();
  });

  it('leaves a document without a taxonomyList reference untouched', () => {
    expect(foldTaxonomyListIntoModules({})).toBeUndefined();
  });
});
