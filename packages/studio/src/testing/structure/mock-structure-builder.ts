import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import { mockStructureNode } from '@blog/studio/testing/structure/mock-structure-node';
import type { StructureBuilder } from 'sanity/structure';

export const MOCK_PERSPECTIVE = 'drafts';

export const mockStructureBuilder = (dataset: unknown[] = []) => {
  const client = { fetch: mockGroqFetch(dataset) };

  return {
    client,
    context: {
      getClient: () => client,
      perspectiveStack: [MOCK_PERSPECTIVE],
    },
    divider: vi.fn(() => mockStructureNode('divider')),
    listItem: vi.fn(() => mockStructureNode('listItem')),
    documentTypeListItem: vi.fn((documentType: string) =>
      mockStructureNode('documentTypeListItem', documentType),
    ),
    documentTypeList: vi.fn((documentType: string) =>
      mockStructureNode('documentTypeList', documentType),
    ),
    document: vi.fn(() => mockStructureNode('document')),
    list: vi.fn(() => mockStructureNode('list')),
    component: vi.fn(() => mockStructureNode('component')),
    menuItem: vi.fn(() => mockStructureNode('menuItem')),
    initialValueTemplateItem: vi.fn((templateId: string) => ({ templateId })),
  };
};

export type TMockStructureBuilder = ReturnType<typeof mockStructureBuilder>;

export const asStructureBuilder = (S: TMockStructureBuilder) =>
  S as unknown as StructureBuilder;

export const matchingIds = (
  dataset: unknown[],
  filter: string,
  params: Record<string, unknown>,
) => mockGroqFetch(dataset)(`*[${filter}]._id`, params);
