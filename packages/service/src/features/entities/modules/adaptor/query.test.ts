import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import {
  linkIdsReferencingDocumentQuery,
  referencingModuleIdsQuery,
} from './query';

function reference(id: string) {
  return { _type: 'reference', _ref: id };
}

const dataset = [
  { _id: 'post-1', _type: 'page_post' },
  {
    _id: 'link-to-post',
    _type: 'link',
    internalReference: reference('post-1'),
  },
  {
    _id: 'link-to-other',
    _type: 'link',
    internalReference: reference('post-2'),
  },
  { _id: 'module-direct', _type: 'module_cta', target: reference('post-1') },
  {
    _id: 'module-via-link',
    _type: 'module_hero',
    link: reference('link-to-post'),
  },
  {
    _id: 'module-unrelated',
    _type: 'module_cta',
    target: reference('post-2'),
  },
  {
    _id: 'blog_module-direct',
    _type: 'blog_module',
    target: reference('post-1'),
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
    expect(await findLinkIds('post-1')).toEqual(['link-to-post']);
  });

  it('lists nothing when no link references the document', async () => {
    expect(await findLinkIds('unreferenced')).toEqual([]);
  });
});

describe('referencingModuleIdsQuery', () => {
  it('matches modules that reference the document directly or through a link', async () => {
    const ids = await findModuleIds('post-1', ['link-to-post']);

    expect(ids).toHaveLength(2);
    expect(ids).toEqual(
      expect.arrayContaining(['module-direct', 'module-via-link']),
    );
  });

  it('still matches direct references when no link references the document', async () => {
    expect(await findModuleIds('post-1', [])).toEqual(['module-direct']);
  });

  it('skips modules that reference neither the document nor its links', async () => {
    expect(await findModuleIds('post-1', ['link-to-post'])).not.toContain(
      'module-unrelated',
    );
  });

  it('skips documents whose type only contains a module prefix elsewhere', async () => {
    expect(await findModuleIds('post-1', ['link-to-post'])).not.toContain(
      'blog_module-direct',
    );
  });

  it('rejects a result that is not a list of ids', () => {
    expect(() =>
      referencingModuleIdsQuery.parse([{ _id: 'module-a' }]),
    ).toThrow();
  });
});
