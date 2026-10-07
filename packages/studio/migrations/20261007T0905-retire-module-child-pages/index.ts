// Must run after 20261007T0900-create-module-section-pages-from-child-pages — Sanity refuses to delete a still-referenced document.
import { defineMigration, del, type Mutation } from 'sanity/migrate';

import { toSectionPagesId } from '../20261007T0900-create-module-section-pages-from-child-pages/id';
import { assertCounterpartDeletable } from '../lib/assert-counterpart-deletable';

const LEGACY_TYPE = 'module_childPages';
const TARGET_TYPE = 'module_sectionPages';

const hasTitle = (title: unknown): boolean => Boolean(title);

type TRawDocument = { _id: string; _type: string };

export default defineMigration({
  title:
    'Retire module_childPages: delete documents now represented by module_sectionPages',
  documentTypes: [LEGACY_TYPE],
  migrate: {
    async document(rawDoc, context) {
      const doc = rawDoc as unknown as TRawDocument;
      const mutations: Mutation[] = [];

      if (doc._type === LEGACY_TYPE) {
        await assertCounterpartDeletable(
          context,
          doc._id,
          toSectionPagesId(doc._id),
          {
            sourceType: LEGACY_TYPE,
            counterpartType: TARGET_TYPE,
            counterpartIdParam: 'sectionPagesId',
            field: 'title',
            hasValue: hasTitle,
          },
        );
        mutations.push(del(doc._id));
      }

      return mutations;
    },
  },
});
