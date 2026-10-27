import { schemaTypes } from '@blog/studio/schema-types';
import { inlineLinkSchema } from '@blog/studio/schema-types/objects/inline-link/inline-link';
import { faker } from '@faker-js/faker';
import { set } from 'sanity/migrate';

import migration from './index';

faker.seed(6018);

const LEGACY_LINK_TYPE = 'link';
const MOCK_LABEL = faker.lorem.words();
const MOCK_URL = faker.internet.url();
const MOCK_BLOCK_KEY = faker.string.uuid();
const MOCK_MARK_KEY = faker.string.uuid();

const objectHandler = migration.migrate.object;

if (!objectHandler) {
  throw new Error('Expected the migration to define an object() node handler.');
}

type TTypeNode = {
  name?: string;
  type?: string;
  fields?: TTypeNode[];
  of?: TTypeNode[];
  marks?: { annotations?: TTypeNode[] };
};

const collectDirectTypeRefs = (nodes: TTypeNode[] | undefined): Set<string> => {
  const refs = new Set<string>();

  const visit = (node: TTypeNode | undefined): void => {
    if (!node) return;
    if (typeof node.type === 'string') refs.add(node.type);
    node.fields?.forEach(visit);
    node.of?.forEach(visit);
    node.marks?.annotations?.forEach(visit);
  };

  nodes?.forEach(visit);

  return refs;
};

const typesEmbedding = (targetName: string): Set<string> => {
  const embedding = new Set([targetName]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const schemaType of schemaTypes as TTypeNode[]) {
      const name = schemaType.name;

      if (!name || embedding.has(name)) continue;

      const directRefs = collectDirectTypeRefs([
        ...(schemaType.fields ?? []),
        ...(schemaType.of ?? []),
        ...(schemaType.marks?.annotations ?? []),
      ]);

      if ([...directRefs].some((ref) => embedding.has(ref))) {
        embedding.add(name);
        changed = true;
      }
    }
  }

  return embedding;
};

describe('rename-link-object-to-inline-link migration', () => {
  it('renames a legacy inline link at a known path', () => {
    const node = { _type: LEGACY_LINK_TYPE, label: MOCK_LABEL, url: MOCK_URL };

    const result = objectHandler(node, ['secondaryAction']);

    expect(result).toEqual(set({ ...node, _type: inlineLinkSchema.name }));
  });

  it('leaves a node outside every known inline-link path alone', () => {
    const node = { _type: LEGACY_LINK_TYPE, href: MOCK_URL };

    const result = objectHandler(node, [
      'body',
      { _key: MOCK_BLOCK_KEY },
      'markDefs',
      { _key: MOCK_MARK_KEY },
    ]);

    expect(result).toBeUndefined();
  });

  it('covers every document type that embeds inlineLink in the schema', () => {
    const embedding = typesEmbedding(inlineLinkSchema.name);

    const derivedDocumentTypes = (schemaTypes as TTypeNode[])
      .filter(
        (schemaType) =>
          schemaType.type === 'document' &&
          schemaType.name !== undefined &&
          embedding.has(schemaType.name),
      )
      .map((schemaType) => schemaType.name as string);

    const documentTypes = new Set(migration.documentTypes);
    const missingFromMigration = derivedDocumentTypes.filter(
      (type) => !documentTypes.has(type),
    );

    expect(missingFromMigration).toEqual([]);
  });
});
