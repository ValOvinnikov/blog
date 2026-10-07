// _type is immutable, so the legacy documents stay until 20261007T0905-retire-module-child-pages deletes them.
import { at, createIfNotExists, defineMigration, set } from 'sanity/migrate';

import { toSectionPagesId } from './id';

const LEGACY_TYPE = 'module_childPages';
const TARGET_TYPE = 'module_sectionPages';

const SYSTEM_FIELDS = new Set([
  '_id',
  '_type',
  '_rev',
  '_createdAt',
  '_updatedAt',
]);

type TRawDocument = { _id: string; _type: string; [key: string]: unknown };

type TModuleReferenceItem = {
  _key: string;
  _type: string;
  _ref: string;
  [key: string]: unknown;
};

type TTemplateDoc = { _id: string; modules?: TModuleReferenceItem[] };

type TStrengthenOnPublish = { type?: string; [key: string]: unknown };

const repointItem = ({
  _strengthenOnPublish,
  ...item
}: TModuleReferenceItem): TModuleReferenceItem => {
  const strengthen = _strengthenOnPublish as TStrengthenOnPublish | undefined;

  return {
    ...item,
    _type: TARGET_TYPE,
    _ref: toSectionPagesId(item._ref),
    ...(strengthen && {
      _strengthenOnPublish: { ...strengthen, type: TARGET_TYPE },
    }),
  };
};

const contentFields = (doc: TRawDocument) =>
  Object.fromEntries(
    Object.entries(doc).filter(([key]) => !SYSTEM_FIELDS.has(key)),
  );

export default defineMigration({
  title:
    'Create module_sectionPages documents from module_childPages and repoint template_landing.modules[]',
  documentTypes: [LEGACY_TYPE, 'template_landing'],
  migrate: {
    document(rawDoc) {
      const doc = rawDoc as unknown as TRawDocument;

      if (doc._type === LEGACY_TYPE) {
        return [
          createIfNotExists({
            ...contentFields(doc),
            _id: toSectionPagesId(doc._id),
            _type: TARGET_TYPE,
          }),
        ];
      }

      const { modules = [] } = doc as unknown as TTemplateDoc;
      const legacyItems = modules.filter((item) => item._type === LEGACY_TYPE);

      if (legacyItems.length === 0) return undefined;

      return legacyItems.map((item) =>
        at(['modules', { _key: item._key }], set(repointItem(item))),
      );
    },
  },
});
