import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { mockReference } from '@blog/studio/testing/mock-documents';
import { faker } from '@faker-js/faker';

import { planTemplates } from './plan-templates';

faker.seed(13);

const { EN, NL } = LOCALE_ISO_CODES;

const TEMPLATE_HOME_TYPE = 'template_home';
const TEMPLATE_LANDING_TYPE = 'template_landing';
const TEMPLATE_TYPES = {
  [PAGE_HOME_TYPE]: TEMPLATE_HOME_TYPE,
  [PAGE_LANDING_TYPE]: TEMPLATE_LANDING_TYPE,
};

const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_DUTCH_PAGE_ID = faker.string.uuid();
const MOCK_TITLE = faker.lorem.words();
const MOCK_DUTCH_TITLE = faker.lorem.words();
const MOCK_DRAFT_TITLE = faker.lorem.words();
const MOCK_HERO = mockReference(faker.string.uuid());
const MOCK_MODULES = [
  {
    _key: faker.string.uuid(),
    _type: 'module_cta',
    _ref: faker.string.uuid(),
  },
];

const templateIdOf = (pageId: string) => `template-${pageId}`;

describe(planTemplates, () => {
  it("gives every page in a translation group the default-language page's layout", () => {
    const plan = planTemplates(
      [
        {
          _id: MOCK_DUTCH_PAGE_ID,
          _type: PAGE_LANDING_TYPE,
          language: NL,
          title: MOCK_DUTCH_TITLE,
          modules: [],
        },
        {
          _id: MOCK_PAGE_ID,
          _type: PAGE_LANDING_TYPE,
          language: EN,
          title: MOCK_TITLE,
          hero: MOCK_HERO,
          modules: MOCK_MODULES,
        },
      ],
      [{ pageIds: [MOCK_PAGE_ID, MOCK_DUTCH_PAGE_ID] }],
      TEMPLATE_TYPES,
    );

    const expected = {
      _id: templateIdOf(MOCK_PAGE_ID),
      _type: TEMPLATE_LANDING_TYPE,
      title: MOCK_TITLE,
      hero: MOCK_HERO,
      modules: MOCK_MODULES,
    };
    expect(plan.get(MOCK_PAGE_ID)).toEqual(expected);
    expect(plan.get(MOCK_DUTCH_PAGE_ID)).toEqual(expected);
  });

  it('gives a standalone page a template of its own', () => {
    const plan = planTemplates(
      [
        {
          _id: MOCK_PAGE_ID,
          _type: PAGE_HOME_TYPE,
          title: MOCK_TITLE,
          hero: MOCK_HERO,
        },
      ],
      [],
      TEMPLATE_TYPES,
    );

    expect(plan.get(MOCK_PAGE_ID)).toEqual({
      _id: templateIdOf(MOCK_PAGE_ID),
      _type: TEMPLATE_HOME_TYPE,
      title: MOCK_TITLE,
      hero: MOCK_HERO,
      modules: undefined,
    });
  });

  it('skips a page whose type has no template type', () => {
    const plan = planTemplates(
      [
        {
          _id: MOCK_PAGE_ID,
          _type: PAGE_POST_TYPE,
          title: MOCK_TITLE,
          modules: MOCK_MODULES,
        },
      ],
      [],
      TEMPLATE_TYPES,
    );

    expect(plan.has(MOCK_PAGE_ID)).toBe(false);
  });

  it('takes the layout from the published page over its draft', () => {
    const plan = planTemplates(
      [
        {
          _id: `drafts.${MOCK_PAGE_ID}`,
          _type: PAGE_LANDING_TYPE,
          language: EN,
          title: MOCK_DRAFT_TITLE,
          modules: [],
        },
        {
          _id: MOCK_PAGE_ID,
          _type: PAGE_LANDING_TYPE,
          language: EN,
          title: MOCK_TITLE,
          modules: MOCK_MODULES,
        },
      ],
      [],
      TEMPLATE_TYPES,
    );

    expect(plan.get(MOCK_PAGE_ID)).toEqual({
      _id: templateIdOf(MOCK_PAGE_ID),
      _type: TEMPLATE_LANDING_TYPE,
      title: MOCK_TITLE,
      hero: undefined,
      modules: MOCK_MODULES,
    });
  });

  it('takes the layout from a draft-only page', () => {
    const plan = planTemplates(
      [
        {
          _id: `drafts.${MOCK_PAGE_ID}`,
          _type: PAGE_LANDING_TYPE,
          language: EN,
          title: MOCK_DRAFT_TITLE,
          modules: MOCK_MODULES,
        },
      ],
      [],
      TEMPLATE_TYPES,
    );

    expect(plan.get(MOCK_PAGE_ID)).toEqual({
      _id: templateIdOf(MOCK_PAGE_ID),
      _type: TEMPLATE_LANDING_TYPE,
      title: MOCK_DRAFT_TITLE,
      hero: undefined,
      modules: MOCK_MODULES,
    });
  });
});
