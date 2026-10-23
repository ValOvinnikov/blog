import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { mockLandingPage } from '@blog/studio/testing/mock-documents';
import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import {
  callArgs,
  mockStructureNode,
  type TMockStructureNode,
} from '@blog/studio/testing/structure/mock-structure-node';
import { FileText } from 'lucide-react';
import type { StructureBuilder } from 'sanity/structure';

import { createPageTreeResolver } from './page-tree';

const ALL_MODULES_TITLE = 'All modules';

vi.mock('@sanity/orderable-document-list', () => ({
  OrderableDocumentList: () => null,
}));

const makeResolver = (
  dataset: Record<string, unknown>[],
  onlyLanguage?: TLocaleIsoCode,
) => {
  const client = { fetch: mockGroqFetch(dataset) };
  const S = {
    context: { getClient: () => client, perspectiveStack: ['drafts'] },
    list: () => mockStructureNode('list'),
    listItem: () => mockStructureNode('listItem'),
    document: () => mockStructureNode('document'),
    component: () => mockStructureNode('component'),
    menuItem: () => mockStructureNode('menuItem'),
  };
  const resolve = createPageTreeResolver(S as unknown as StructureBuilder, {
    name: PAGE_LANDING_TYPE,
    icon: FileText,
    onlyLanguage,
  });
  return {
    client,
    resolve: (id: string) =>
      resolve(id, {} as never) as unknown as Promise<TMockStructureNode>,
  };
};

const modules = mockLandingPage({ _id: 'modules', title: 'Modules' });
const faq = mockLandingPage({ _id: 'faq', title: 'FAQ', parent: 'modules' });

const sectionPagesOf = (pane: TMockStructureNode) => {
  const [, childrenItem] = callArgs(pane, 'items')?.[0] as TMockStructureNode[];
  return callArgs(childrenItem!, 'child')?.[0] as TMockStructureNode;
};

describe('createPageTreeResolver', () => {
  let resolve: ReturnType<typeof makeResolver>['resolve'];
  let client: ReturnType<typeof makeResolver>['client'];

  beforeEach(() => {
    ({ resolve, client } = makeResolver([modules, faq]));
  });

  it('opens a page without children straight in the editor', async () => {
    const pane = await resolve('faq');

    expect(pane.kind).toBe('document');
    expect(callArgs(pane, 'schemaType')).toEqual([PAGE_LANDING_TYPE]);
    expect(callArgs(pane, 'documentId')).toEqual(['faq']);
  });

  it('offers a page with children as the page plus its section pages', async () => {
    const pane = await resolve('modules');
    const items = callArgs(pane, 'items')?.[0] as TMockStructureNode[];

    expect(pane.kind).toBe('list');
    expect(callArgs(pane, 'title')).toEqual(['Modules']);
    expect(items.map((item) => callArgs(item, 'title')?.[0])).toEqual([
      'Page',
      'Section pages',
    ]);
    expect(
      callArgs(
        callArgs(items[0]!, 'child')?.[0] as TMockStructureNode,
        'documentId',
      ),
    ).toEqual(['modules']);
  });

  it('counts a child that exists only as a draft', async () => {
    const { resolve: resolveWithDraftChild } = makeResolver([
      modules,
      { ...faq, _id: 'drafts.faq' },
    ]);

    expect((await resolveWithDraftChild('modules')).kind).toBe('list');
  });

  it('titles the pane from the draft when the page has unpublished edits', async () => {
    const { resolve: resolveWithDraft } = makeResolver([
      modules,
      { ...modules, _id: 'drafts.modules', title: ALL_MODULES_TITLE },
      faq,
    ]);

    expect(callArgs(await resolveWithDraft('modules'), 'title')).toEqual([
      ALL_MODULES_TITLE,
    ]);
  });

  it('lists only the direct children, in the current perspective', async () => {
    const options = callArgs(
      sectionPagesOf(await resolve('modules')),
      'options',
    )?.[0] as Record<string, unknown>;

    expect(options).toEqual({
      type: PAGE_LANDING_TYPE,
      filter: 'parent._ref == $parentId',
      params: { parentId: 'modules' },
      client,
      currentVersion: 'drafts',
    });
  });

  it('opens each section page through the same tree', async () => {
    const resolveChild = callArgs(
      sectionPagesOf(await resolve('modules')),
      'child',
    )?.[0] as (id: string) => Promise<TMockStructureNode>;

    expect((await resolveChild('faq')).kind).toBe('document');
    expect((await resolveChild('modules')).kind).toBe('list');
  });

  describe('with one live language', () => {
    const dutchFaq = {
      ...faq,
      _id: 'dutch-faq',
      language: LOCALE_ISO_CODES.NL,
    };
    const englishFaq = {
      ...faq,
      _id: 'english-faq',
      language: LOCALE_ISO_CODES.EN,
    };

    const sectionPageIds = async (
      dataset: Record<string, unknown>[],
      parentId: string,
    ) => {
      const { resolve: resolveInDutch } = makeResolver(
        dataset,
        LOCALE_ISO_CODES.NL,
      );
      const { filter, params } = callArgs(
        sectionPagesOf(await resolveInDutch(parentId)),
        'options',
      )?.[0] as { filter: string; params: Record<string, unknown> };
      return mockGroqFetch(dataset)(`*[${filter}]._id`, params);
    };

    it('lists only section pages in that language or with no language', async () => {
      expect(
        await sectionPageIds([modules, faq, dutchFaq, englishFaq], 'modules'),
      ).toEqual(['faq', 'dutch-faq']);
    });

    it('opens a page whose only children are in another language straight in the editor', async () => {
      const { resolve: resolveInDutch } = makeResolver(
        [modules, englishFaq],
        LOCALE_ISO_CODES.NL,
      );

      expect((await resolveInDutch('modules')).kind).toBe('document');
    });
  });

  it('wires the reset and increments actions the orderable list handles', async () => {
    const menuItems = callArgs(
      sectionPagesOf(await resolve('modules')),
      'menuItems',
    )?.[0] as TMockStructureNode[];

    expect(menuItems.map((item) => callArgs(item, 'action')?.[0])).toEqual([
      'resetOrder',
      'showIncrements',
    ]);
  });
});
