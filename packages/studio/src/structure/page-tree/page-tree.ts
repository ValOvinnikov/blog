import { OrderableDocumentList } from '@sanity/orderable-document-list';
import { ListOrdered } from 'lucide-react';
import { getDraftId, type SchemaTypeDefinition } from 'sanity';
import type {
  ChildResolver,
  StructureBuilder,
  UserComponent,
} from 'sanity/structure';

const PAGE_TREE_API_VERSION = '2025-06-27';

const PAGE_SUMMARY_QUERY = `{
  "title": coalesce(*[_id == $draftId][0].title, *[_id == $id][0].title, ""),
  "hasChildren": count(*[_type == $type && parent._ref == $id]) > 0
}`;

type TPageSummary = { title: string; hasChildren: boolean };

type TPageTreeSchema = Pick<SchemaTypeDefinition, 'name' | 'icon'>;

// The plugin types its pane options as required, which a structure pane's `options` never is.
const orderableList = OrderableDocumentList as unknown as UserComponent;

export const createPageTreeResolver = (
  S: StructureBuilder,
  { name, icon }: TPageTreeSchema,
): ChildResolver => {
  const client = () =>
    S.context.getClient({ apiVersion: PAGE_TREE_API_VERSION });

  const pageDocument = (id: string) =>
    S.document().schemaType(name).documentId(id);

  const childPages = (id: string, title: string) =>
    S.component(orderableList)
      .id(`${id}-children`)
      .title(`${title} — child pages`)
      .options({
        type: name,
        filter: `parent._ref == $parentId`,
        params: { parentId: id },
        client: client(),
        currentVersion: S.context.perspectiveStack[0],
      })
      .menuItems([
        S.menuItem().title('Reset Order').action('resetOrder'),
        S.menuItem().title('Toggle Increments').action('showIncrements'),
      ])
      .child(resolvePage);

  const resolvePage = async (id: string) => {
    const { title, hasChildren } = await client().fetch<TPageSummary>(
      PAGE_SUMMARY_QUERY,
      { type: name, id, draftId: getDraftId(id) },
    );

    if (!hasChildren) {
      return pageDocument(id);
    }

    return S.list()
      .id(id)
      .title(title)
      .items([
        S.listItem()
          .id('page')
          .title('Page')
          .icon(icon)
          .child(pageDocument(id)),
        S.listItem()
          .id('children')
          .title('Child pages')
          .icon(ListOrdered)
          .child(childPages(id, title)),
      ]);
  };

  return resolvePage;
};
