import { evaluate, parse } from 'groq-js';
import { FileText } from 'lucide-react';
import type { StructureBuilder } from 'sanity/structure';

import { createPageTreeResolver } from './page-tree';

vi.mock('@sanity/orderable-document-list', () => ({
  OrderableDocumentList: () => null,
}));

type TCall = { method: string; args: unknown[] };
type TMockBuilder = { kind: string; calls: TCall[] } & Record<string, unknown>;

const CHAINABLE_METHODS = [
  'id',
  'title',
  'icon',
  'child',
  'items',
  'schemaType',
  'documentId',
  'options',
  'menuItems',
  'action',
] as const;

const makeMockBuilder = (kind: string): TMockBuilder => {
  const calls: TCall[] = [];
  const builder: TMockBuilder = { kind, calls };
  for (const method of CHAINABLE_METHODS) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  return builder;
};

const callArgs = (builder: TMockBuilder, method: string) =>
  builder.calls.find((call) => call.method === method)?.args;

const makeResolver = (dataset: Record<string, unknown>[]) => {
  const client = {
    fetch: async (query: string, params: Record<string, unknown>) =>
      (await evaluate(parse(query), { dataset, params })).get(),
  };
  const S = {
    context: { getClient: () => client, perspectiveStack: ['drafts'] },
    list: () => makeMockBuilder('list'),
    listItem: () => makeMockBuilder('listItem'),
    document: () => makeMockBuilder('document'),
    component: () => makeMockBuilder('component'),
    menuItem: () => makeMockBuilder('menuItem'),
  };
  const resolve = createPageTreeResolver(S as unknown as StructureBuilder, {
    name: 'page_landing',
    icon: FileText,
  });
  return {
    client,
    resolve: (id: string) =>
      resolve(id, {} as never) as unknown as Promise<TMockBuilder>,
  };
};

const modules = { _id: 'modules', _type: 'page_landing', title: 'Modules' };
const faq = {
  _id: 'faq',
  _type: 'page_landing',
  title: 'FAQ',
  parent: { _type: 'reference', _ref: 'modules' },
};

const childPagesOf = (pane: TMockBuilder) => {
  const [, childrenItem] = callArgs(pane, 'items')?.[0] as TMockBuilder[];
  return callArgs(childrenItem!, 'child')?.[0] as TMockBuilder;
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
    expect(callArgs(pane, 'schemaType')).toEqual(['page_landing']);
    expect(callArgs(pane, 'documentId')).toEqual(['faq']);
  });

  it('offers a page with children as the page plus its child pages', async () => {
    const pane = await resolve('modules');
    const items = callArgs(pane, 'items')?.[0] as TMockBuilder[];

    expect(pane.kind).toBe('list');
    expect(callArgs(pane, 'title')).toEqual(['Modules']);
    expect(items.map((item) => callArgs(item, 'title')?.[0])).toEqual([
      'Page',
      'Child pages',
    ]);
    expect(
      callArgs(callArgs(items[0]!, 'child')?.[0] as TMockBuilder, 'documentId'),
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
      { ...modules, _id: 'drafts.modules', title: 'All modules' },
      faq,
    ]);

    expect(callArgs(await resolveWithDraft('modules'), 'title')).toEqual([
      'All modules',
    ]);
  });

  it('lists only the direct children, in the current perspective', async () => {
    const options = callArgs(
      childPagesOf(await resolve('modules')),
      'options',
    )?.[0] as Record<string, unknown>;

    expect(options).toEqual({
      type: 'page_landing',
      filter: 'parent._ref == $parentId',
      params: { parentId: 'modules' },
      client,
      currentVersion: 'drafts',
    });
  });

  it('opens each child page through the same tree', async () => {
    const resolveChild = callArgs(
      childPagesOf(await resolve('modules')),
      'child',
    )?.[0] as (id: string) => Promise<TMockBuilder>;

    expect((await resolveChild('faq')).kind).toBe('document');
    expect((await resolveChild('modules')).kind).toBe('list');
  });

  it('wires the reset and increments actions the orderable list handles', async () => {
    const menuItems = callArgs(
      childPagesOf(await resolve('modules')),
      'menuItems',
    )?.[0] as TMockBuilder[];

    expect(menuItems.map((item) => callArgs(item, 'action')?.[0])).toEqual([
      'resetOrder',
      'showIncrements',
    ]);
  });
});
