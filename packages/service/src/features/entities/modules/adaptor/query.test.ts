import {
  MOCK_POST_ID,
  mockReference,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import {
  linkIdsReferencingDocumentQuery,
  referencingModuleIdsQuery,
} from './query';

faker.seed(6102);

const MOCK_OTHER_POST_ID = faker.string.uuid();
const MOCK_UNREFERENCED_ID = faker.string.uuid();
const MOCK_LINK_TO_POST_ID = faker.string.uuid();
const MOCK_LINK_TO_OTHER_ID = faker.string.uuid();
const MOCK_DIRECT_MODULE_ID = faker.string.uuid();
const MOCK_VIA_LINK_MODULE_ID = faker.string.uuid();
const MOCK_UNRELATED_MODULE_ID = faker.string.uuid();
const MOCK_LEGACY_MODULE_ID = faker.string.uuid();

const dataset = [
  { _id: MOCK_POST_ID, _type: 'page_post' },
  {
    _id: MOCK_LINK_TO_POST_ID,
    _type: 'link',
    internalReference: mockReference(MOCK_POST_ID),
  },
  {
    _id: MOCK_LINK_TO_OTHER_ID,
    _type: 'link',
    internalReference: mockReference(MOCK_OTHER_POST_ID),
  },
  {
    _id: MOCK_DIRECT_MODULE_ID,
    _type: 'module_cta',
    target: mockReference(MOCK_POST_ID),
  },
  {
    _id: MOCK_VIA_LINK_MODULE_ID,
    _type: 'module_hero',
    link: mockReference(MOCK_LINK_TO_POST_ID),
  },
  {
    _id: MOCK_UNRELATED_MODULE_ID,
    _type: 'module_cta',
    target: mockReference(MOCK_OTHER_POST_ID),
  },
  {
    _id: MOCK_LEGACY_MODULE_ID,
    _type: 'blog_module',
    target: mockReference(MOCK_POST_ID),
  },
];

async function findLinkIds(documentId: string) {
  const raw = await evaluateGroqExpression(
    linkIdsReferencingDocumentQuery.query,
    dataset,
    null,
    { documentId },
  );

  return linkIdsReferencingDocumentQuery.parse(raw);
}

async function findModuleIds(documentId: string, linkIds: string[]) {
  const raw = await evaluateGroqExpression(
    referencingModuleIdsQuery.query,
    dataset,
    null,
    { documentId, linkIds },
  );

  return referencingModuleIdsQuery.parse(raw);
}

describe('linkIdsReferencingDocumentQuery', () => {
  it('lists the links that reference the document', async () => {
    const ids = await findLinkIds(MOCK_POST_ID);

    expect(ids).toEqual([MOCK_LINK_TO_POST_ID]);
  });

  it('lists nothing when no link references the document', async () => {
    const ids = await findLinkIds(MOCK_UNREFERENCED_ID);

    expect(ids).toEqual([]);
  });
});

describe('referencingModuleIdsQuery', () => {
  it('matches modules that reference the document directly or through a link', async () => {
    const ids = await findModuleIds(MOCK_POST_ID, [MOCK_LINK_TO_POST_ID]);

    expect([...ids].sort()).toEqual(
      [MOCK_DIRECT_MODULE_ID, MOCK_VIA_LINK_MODULE_ID].sort(),
    );
  });

  it('still matches direct references when no link references the document', async () => {
    const ids = await findModuleIds(MOCK_POST_ID, []);

    expect(ids).toEqual([MOCK_DIRECT_MODULE_ID]);
  });

  it('rejects a result that is not a list of ids', () => {
    expect(() =>
      referencingModuleIdsQuery.parse([{ _id: MOCK_DIRECT_MODULE_ID }]),
    ).toThrow();
  });
});
