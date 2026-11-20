import { STARTER_DOCUMENT_IDS } from '@shinefold/config';
import {
  LOCALE_ISO_CODES,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@shinefold/config/constants';
import { toDraftId } from '@shinefold/utils/sanity-document-id';
import {
  MOCK_OWNER_DOCUMENT_ID,
  MOCK_REVISION,
  mockKeyedReference,
  mockReference,
  mockSanityDocument,
} from '@worker/testing/sample-content/fixtures';

import { planSampleContentRemoval } from './plan-sample-content-removal';

const ids = STARTER_DOCUMENT_IDS;
const locale = LOCALE_ISO_CODES.EN;

const MOCK_RELEASE_ID = 'spring';

function mockNavigationItem(linkId: string, fields = {}) {
  return {
    _key: linkId,
    _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
    link: mockReference(linkId),
    ...fields,
  };
}

function toRemoval(documentId: string) {
  return { documentId, revision: MOCK_REVISION };
}

function kept(id: string) {
  return expect.objectContaining({ id });
}

function unedited(id: string, fields = {}) {
  return mockSanityDocument(id, fields);
}

describe(planSampleContentRemoval, () => {
  it('removes unedited samples and unlinks them from the seeded arrays by key', () => {
    const plan = planSampleContentRemoval({
      locale,
      starterDocuments: [
        unedited(ids.BLOG_CTA),
        unedited(ids.BLOG_POST_LIST),
        unedited(ids.BLOG_ABOUT_LINK),
      ],
      pendingIds: [],
      referrers: [
        unedited(ids.HOME_TEMPLATE, {
          modules: [mockKeyedReference(ids.BLOG_CTA)],
        }),
        unedited(ids.POST_INDEX_TEMPLATE, {
          modules: [mockKeyedReference(ids.BLOG_POST_LIST)],
        }),
        unedited(ids.NAVIGATION, {
          items: [mockNavigationItem(ids.BLOG_ABOUT_LINK)],
        }),
      ],
    });

    expect(plan).toEqual({
      removals: [ids.BLOG_ABOUT_LINK, ids.BLOG_CTA, ids.BLOG_POST_LIST].map(
        toRemoval,
      ),
      unlinks: [
        {
          documentId: ids.HOME_TEMPLATE,
          revision: MOCK_REVISION,
          field: 'modules',
          keys: [ids.BLOG_CTA],
        },
        {
          documentId: ids.POST_INDEX_TEMPLATE,
          revision: MOCK_REVISION,
          field: 'modules',
          keys: [ids.BLOG_POST_LIST],
        },
        {
          documentId: ids.NAVIGATION,
          revision: MOCK_REVISION,
          field: 'items',
          keys: [ids.BLOG_ABOUT_LINK],
        },
      ],
      keptEdited: [],
      keptReferenced: [],
    });
  });

  it.each([
    ['changed since seeding', [], { isEdited: true }],
    ['with a pending draft', [toDraftId(ids.BLOG_CTA)], {}],
    [
      'with a pending release version',
      [`versions.${MOCK_RELEASE_ID}.${ids.BLOG_CTA}`],
      {},
    ],
  ])('keeps a sample %s as edited', (_label, pendingIds, options) => {
    const plan = planSampleContentRemoval({
      locale,
      starterDocuments: [mockSanityDocument(ids.BLOG_CTA, {}, options)],
      pendingIds,
      referrers: [],
    });

    expect(plan).toEqual({
      removals: [],
      unlinks: [],
      keptEdited: [kept(ids.BLOG_CTA)],
      keptReferenced: [],
    });
  });

  it('keeps a sample a single field holds, and the samples it references in turn', () => {
    const plan = planSampleContentRemoval({
      locale,
      starterDocuments: [
        unedited(ids.BLOG_HERO, { post: mockReference(ids.BLOG_WELCOME_POST) }),
        unedited(ids.BLOG_WELCOME_POST, {
          author: mockReference(ids.BLOG_AUTHOR),
        }),
        unedited(ids.BLOG_AUTHOR),
      ],
      pendingIds: [],
      referrers: [
        unedited(ids.HOME_TEMPLATE, { hero: mockReference(ids.BLOG_HERO) }),
      ],
    });

    expect(plan).toEqual({
      removals: [],
      unlinks: [],
      keptEdited: [],
      keptReferenced: [
        ids.BLOG_AUTHOR,
        ids.BLOG_HERO,
        ids.BLOG_WELCOME_POST,
      ].map(kept),
    });
  });

  it.each([
    [
      "the owner's own document",
      unedited(MOCK_OWNER_DOCUMENT_ID, {
        topics: [mockKeyedReference(ids.BLOG_TOPIC)],
      }),
    ],
    [
      'a pending draft of a seeded document',
      unedited(toDraftId(ids.HOME_TEMPLATE), {
        modules: [mockKeyedReference(ids.BLOG_TOPIC)],
      }),
    ],
    [
      'an edited sample',
      mockSanityDocument(
        ids.BLOG_WELCOME_POST,
        { topics: [mockKeyedReference(ids.BLOG_TOPIC)] },
        { isEdited: true },
      ),
    ],
  ])('keeps a sample %s references', (_label, referrer) => {
    const plan = planSampleContentRemoval({
      locale,
      starterDocuments: [unedited(ids.BLOG_TOPIC)],
      pendingIds: [],
      referrers: [referrer],
    });

    expect(plan.removals).toEqual([]);
    expect(plan.keptReferenced).toEqual([kept(ids.BLOG_TOPIC)]);
  });

  it('keeps a navigation link whose item also holds links the owner added', () => {
    const plan = planSampleContentRemoval({
      locale,
      starterDocuments: [unedited(ids.BLOG_ABOUT_LINK)],
      pendingIds: [],
      referrers: [
        unedited(ids.NAVIGATION, {
          items: [
            mockNavigationItem(ids.BLOG_ABOUT_LINK, {
              subItems: [mockNavigationItem(MOCK_OWNER_DOCUMENT_ID)],
            }),
          ],
        }),
      ],
    });

    expect(plan).toEqual({
      removals: [],
      unlinks: [],
      keptEdited: [],
      keptReferenced: [kept(ids.BLOG_ABOUT_LINK)],
    });
  });

  it('removes samples that only reference each other without unlinking anything', () => {
    const plan = planSampleContentRemoval({
      locale,
      starterDocuments: [
        unedited(ids.BLOG_ABOUT, {
          template: mockReference(ids.BLOG_ABOUT_TEMPLATE),
        }),
        unedited(ids.BLOG_ABOUT_TEMPLATE),
      ],
      pendingIds: [],
      referrers: [],
    });

    expect(plan).toEqual({
      removals: [ids.BLOG_ABOUT, ids.BLOG_ABOUT_TEMPLATE].map(toRemoval),
      unlinks: [],
      keptEdited: [],
      keptReferenced: [],
    });
  });
});
