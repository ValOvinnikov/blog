import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { mockLandingPage } from '@blog/studio/testing/mock-documents';
import {
  asStructureBuilder,
  matchingIds,
  MOCK_PERSPECTIVE,
  mockStructureBuilder,
} from '@blog/studio/testing/structure/mock-structure-builder';
import {
  callArgs,
  type TMockStructureNode,
} from '@blog/studio/testing/structure/mock-structure-node';
import { faker } from '@faker-js/faker';
import { FileText } from 'lucide-react';
import { getDraftId } from 'sanity';

import { createPageTreeResolver } from './page-tree';

faker.seed(6017);

vi.mock('@sanity/orderable-document-list', () => ({
  OrderableDocumentList: () => null,
}));

type TDataset = Record<string, unknown>[];
type TResolve = (id: string) => Promise<TMockStructureNode>;

const MOCK_PARENT = mockLandingPage({
  _id: faker.string.uuid(),
  title: faker.lorem.words(2),
});
const MOCK_CHILD = mockLandingPage({
  _id: faker.string.uuid(),
  title: faker.lorem.words(2),
  parent: MOCK_PARENT._id,
});
const MOCK_GRANDCHILD = mockLandingPage({
  _id: faker.string.uuid(),
  parent: MOCK_CHILD._id,
});
const MOCK_DRAFT_TITLE = faker.lorem.words(3);
const MOCK_DUTCH_CHILD = {
  ...MOCK_CHILD,
  _id: faker.string.uuid(),
  language: LOCALE_ISO_CODES.NL,
};
const MOCK_ENGLISH_CHILD = {
  ...MOCK_CHILD,
  _id: faker.string.uuid(),
  language: LOCALE_ISO_CODES.EN,
};

const mockResolver = (dataset: TDataset, onlyLanguage?: TLocaleIsoCode) => {
  const S = mockStructureBuilder(dataset);
  const resolve = createPageTreeResolver(asStructureBuilder(S), {
    name: PAGE_LANDING_TYPE,
    icon: FileText,
    onlyLanguage,
  });

  return {
    client: S.client,
    resolve: (id: string) =>
      resolve(id, {} as never) as unknown as Promise<TMockStructureNode>,
  };
};

const childOf = (node: TMockStructureNode) =>
  callArgs(node, 'child')?.[0] as TMockStructureNode;

const itemsOf = (node: TMockStructureNode) =>
  callArgs(node, 'items')?.[0] as TMockStructureNode[];

const sectionPagesOf = (pane: TMockStructureNode) => {
  const [, childrenItem] = itemsOf(pane);
  return childOf(childrenItem!);
};

const optionsOf = (sectionPages: TMockStructureNode) =>
  callArgs(sectionPages, 'options')?.[0] as {
    filter: string;
    params: Record<string, unknown>;
  } & Record<string, unknown>;

const sectionPageIds = async (
  dataset: TDataset,
  onlyLanguage?: TLocaleIsoCode,
) => {
  const { resolve } = mockResolver(dataset, onlyLanguage);
  const { filter, params } = optionsOf(
    sectionPagesOf(await resolve(MOCK_PARENT._id)),
  );
  return matchingIds(dataset, filter, params);
};

describe(createPageTreeResolver, () => {
  let resolve: TResolve;
  let client: ReturnType<typeof mockResolver>['client'];

  beforeEach(() => {
    ({ resolve, client } = mockResolver([MOCK_PARENT, MOCK_CHILD]));
  });

  it('opens a page without children straight in the editor', async () => {
    const pane = await resolve(MOCK_CHILD._id);

    expect(pane.kind).toBe('document');
    expect(callArgs(pane, 'schemaType')).toEqual([PAGE_LANDING_TYPE]);
    expect(callArgs(pane, 'documentId')).toEqual([MOCK_CHILD._id]);
  });

  it('offers a page with children as the page plus its section pages', async () => {
    const pane = await resolve(MOCK_PARENT._id);
    const [pageItem, sectionPagesItem] = itemsOf(pane);
    const page = childOf(pageItem!);

    expect(pane.kind).toBe('list');
    expect(callArgs(pane, 'title')).toEqual([MOCK_PARENT.title]);
    expect(page.kind).toBe('document');
    expect(callArgs(page, 'documentId')).toEqual([MOCK_PARENT._id]);
    expect(childOf(sectionPagesItem!).kind).toBe('component');
  });

  it('counts a child that exists only as a draft', async () => {
    const { resolve: resolveWithDraftChild } = mockResolver([
      MOCK_PARENT,
      { ...MOCK_CHILD, _id: getDraftId(MOCK_CHILD._id) },
    ]);

    const pane = await resolveWithDraftChild(MOCK_PARENT._id);

    expect(pane.kind).toBe('list');
  });

  it('titles the pane from the draft when the page has unpublished edits', async () => {
    const { resolve: resolveWithDraft } = mockResolver([
      MOCK_PARENT,
      {
        ...MOCK_PARENT,
        _id: getDraftId(MOCK_PARENT._id),
        title: MOCK_DRAFT_TITLE,
      },
      MOCK_CHILD,
    ]);

    const pane = await resolveWithDraft(MOCK_PARENT._id);

    expect(callArgs(pane, 'title')).toEqual([MOCK_DRAFT_TITLE]);
  });

  it('lists the section pages of its type in the current perspective', async () => {
    const {
      type,
      client: listClient,
      currentVersion,
    } = optionsOf(sectionPagesOf(await resolve(MOCK_PARENT._id)));

    expect(type).toBe(PAGE_LANDING_TYPE);
    expect(listClient).toBe(client);
    expect(currentVersion).toBe(MOCK_PERSPECTIVE);
  });

  it('lists only the direct children as section pages', async () => {
    const ids = await sectionPageIds([
      MOCK_PARENT,
      MOCK_CHILD,
      MOCK_GRANDCHILD,
    ]);

    expect(ids).toEqual([MOCK_CHILD._id]);
  });

  it('opens each section page through the same tree', async () => {
    const resolveSectionPage = childOf(
      sectionPagesOf(await resolve(MOCK_PARENT._id)),
    ) as unknown as TResolve;

    const leaf = await resolveSectionPage(MOCK_CHILD._id);
    const branch = await resolveSectionPage(MOCK_PARENT._id);

    expect(leaf.kind).toBe('document');
    expect(branch.kind).toBe('list');
  });

  it('wires the reset and increments actions the orderable list handles', async () => {
    const menuItems = callArgs(
      sectionPagesOf(await resolve(MOCK_PARENT._id)),
      'menuItems',
    )?.[0] as TMockStructureNode[];

    expect(menuItems.map((item) => callArgs(item, 'action')?.[0])).toEqual([
      'resetOrder',
      'showIncrements',
    ]);
  });

  describe('with one live language', () => {
    it('lists only section pages in that language or with no language', async () => {
      const ids = await sectionPageIds(
        [MOCK_PARENT, MOCK_CHILD, MOCK_DUTCH_CHILD, MOCK_ENGLISH_CHILD],
        LOCALE_ISO_CODES.NL,
      );

      expect(ids).toEqual([MOCK_CHILD._id, MOCK_DUTCH_CHILD._id]);
    });

    it('opens a page whose children are all in another language in the editor', async () => {
      const { resolve: resolveInDutch } = mockResolver(
        [MOCK_PARENT, MOCK_ENGLISH_CHILD],
        LOCALE_ISO_CODES.NL,
      );

      const pane = await resolveInDutch(MOCK_PARENT._id);

      expect(pane.kind).toBe('document');
    });
  });
});
