import {
  MOCK_POST_ID,
  mockReference,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import {
  linkIdsReferencingDocumentQuery,
  referencingModuleIdsQuery,
} from './query';

const OTHER_POST_ID = 'post-2';
const LINK_TO_POST_ID = 'link-to-post';
const DIRECT_MODULE_ID = 'module-direct';
const VIA_LINK_MODULE_ID = 'module-via-link';
const UNRELATED_MODULE_ID = 'module-unrelated';
const LEGACY_DIRECT_MODULE_ID = 'blog_module-direct';

const dataset = [
  { _id: MOCK_POST_ID, _type: 'page_post' },
  {
    _id: LINK_TO_POST_ID,
    _type: 'link',
    internalReference: mockReference(MOCK_POST_ID),
  },
  {
    _id: 'link-to-other',
    _type: 'link',
    internalReference: mockReference(OTHER_POST_ID),
  },
  {
    _id: DIRECT_MODULE_ID,
    _type: 'module_cta',
    target: mockReference(MOCK_POST_ID),
  },
  {
    _id: VIA_LINK_MODULE_ID,
    _type: 'module_hero',
    link: mockReference(LINK_TO_POST_ID),
  },
  {
    _id: UNRELATED_MODULE_ID,
    _type: 'module_cta',
    target: mockReference(OTHER_POST_ID),
  },
  {
    _id: LEGACY_DIRECT_MODULE_ID,
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
    expect(await findLinkIds(MOCK_POST_ID)).toEqual([LINK_TO_POST_ID]);
  });

  it('lists nothing when no link references the document', async () => {
    expect(await findLinkIds('unreferenced')).toEqual([]);
  });
});

describe('referencingModuleIdsQuery', () => {
  it('matches modules that reference the document directly or through a link', async () => {
    const ids = await findModuleIds(MOCK_POST_ID, [LINK_TO_POST_ID]);

    expect(ids).toHaveLength(2);
    expect(new Set(ids)).toEqual(
      new Set([DIRECT_MODULE_ID, VIA_LINK_MODULE_ID]),
    );
  });

  it('still matches direct references when no link references the document', async () => {
    expect(await findModuleIds(MOCK_POST_ID, [])).toEqual([DIRECT_MODULE_ID]);
  });

  it('skips modules that reference neither the document nor its links', async () => {
    expect(await findModuleIds(MOCK_POST_ID, [LINK_TO_POST_ID])).not.toContain(
      UNRELATED_MODULE_ID,
    );
  });

  it('skips documents whose type only contains a module prefix elsewhere', async () => {
    expect(await findModuleIds(MOCK_POST_ID, [LINK_TO_POST_ID])).not.toContain(
      LEGACY_DIRECT_MODULE_ID,
    );
  });

  it('rejects a result that is not a list of ids', () => {
    expect(() =>
      referencingModuleIdsQuery.parse([{ _id: 'module-a' }]),
    ).toThrow();
  });
});
