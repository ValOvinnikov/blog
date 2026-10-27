import { faker } from '@faker-js/faker';
import { at, unset } from 'sanity/migrate';

import { isPageBlogTargetShapeReady, unsetLegacyBlogPageFields } from './index';

faker.seed(900);

const POST_LIST_MODULE_TYPE = 'module_postList';
const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_POST_LIST_REF = faker.string.uuid();
const MOCK_MODULE_REF = faker.string.uuid();
const MOCK_HEADING = faker.lorem.words();
const MOCK_SUPPORTING_TEXT = faker.lorem.words();
const MOCK_MIGRATED_MODULES = [
  {
    _key: MOCK_POST_LIST_REF,
    _type: POST_LIST_MODULE_TYPE,
    _ref: MOCK_POST_LIST_REF,
  },
];
const MOCK_OTHER_MODULES = [
  { _key: MOCK_MODULE_REF, _type: 'module_cta', _ref: MOCK_MODULE_REF },
];
const MOCK_READY_DOC = {
  _id: MOCK_PAGE_ID,
  modules: MOCK_MIGRATED_MODULES,
  headingBlock: { heading: MOCK_HEADING },
};
const MOCK_LEGACY_DOC = {
  ...MOCK_READY_DOC,
  heading: MOCK_HEADING,
  supportingText: MOCK_SUPPORTING_TEXT,
  postList: { _ref: MOCK_POST_LIST_REF },
};

describe(isPageBlogTargetShapeReady, () => {
  it.each([
    {
      name: 'modules[] has a post list and headingBlock.heading is set',
      doc: MOCK_READY_DOC,
      expected: true,
    },
    {
      name: 'headingBlock.heading has content around whitespace',
      doc: {
        ...MOCK_READY_DOC,
        headingBlock: { heading: ` ${MOCK_HEADING} ` },
      },
      expected: true,
    },
    {
      name: 'there is no headingBlock',
      doc: { _id: MOCK_PAGE_ID, modules: MOCK_MIGRATED_MODULES },
      expected: false,
    },
    {
      name: 'modules[] has no post list',
      doc: { ...MOCK_READY_DOC, modules: MOCK_OTHER_MODULES },
      expected: false,
    },
    {
      name: 'headingBlock.heading is empty',
      doc: { ...MOCK_READY_DOC, headingBlock: { heading: '' } },
      expected: false,
    },
    {
      name: 'headingBlock.heading is whitespace only',
      doc: { ...MOCK_READY_DOC, headingBlock: { heading: '   ' } },
      expected: false,
    },
  ])('is $expected when $name', ({ doc, expected }) => {
    expect(isPageBlogTargetShapeReady(doc)).toBe(expected);
  });
});

describe(unsetLegacyBlogPageFields, () => {
  it('unsets heading, supportingText and postList once the new shape is in place', () => {
    const result = unsetLegacyBlogPageFields(MOCK_LEGACY_DOC);

    expect(result).toEqual([
      at('heading', unset()),
      at('supportingText', unset()),
      at('postList', unset()),
    ]);
  });

  it('only unsets whichever legacy field is still present', () => {
    const result = unsetLegacyBlogPageFields({
      ...MOCK_READY_DOC,
      heading: MOCK_HEADING,
    });

    expect(result).toEqual([at('heading', unset())]);
  });

  it('leaves a doc alone once the legacy fields are already unset', () => {
    const result = unsetLegacyBlogPageFields(MOCK_READY_DOC);

    expect(result).toBeUndefined();
  });

  it.each([
    { name: 'has no headingBlock', fields: { headingBlock: undefined } },
    {
      name: 'has no post list module',
      fields: { modules: MOCK_OTHER_MODULES },
    },
    { name: 'has an empty modules[]', fields: { modules: [] } },
    {
      name: 'has an empty headingBlock.heading',
      fields: { headingBlock: { heading: '' } },
    },
    {
      name: 'has a whitespace-only headingBlock.heading',
      fields: { headingBlock: { heading: '   ' } },
    },
  ])('leaves a doc alone that $name', ({ fields }) => {
    const result = unsetLegacyBlogPageFields({ ...MOCK_LEGACY_DOC, ...fields });

    expect(result).toBeUndefined();
  });
});
