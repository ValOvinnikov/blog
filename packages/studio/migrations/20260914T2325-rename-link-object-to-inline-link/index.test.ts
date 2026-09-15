import { schemaTypes } from '@blog/studio/schema-types';
import { inlineLinkSchema } from '@blog/studio/schema-types/objects/inline-link/inline-link';
import { set } from 'sanity/migrate';

import migration from './index';

/** The `object()` node handler is the only piece of migration logic under test here. */
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

/** Every registered schema type that embeds `targetName`, directly or transitively. */
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

describe('rename-link-object-to-inline-link migration wiring', () => {
  it('returns a set() operation for a legacy inline link at a known path', () => {
    const node = { _type: 'link', label: 'See more', url: '/blog' };

    const result = objectHandler(node, ['secondaryAction']);

    expect(result).toEqual(set({ ...node, _type: 'inlineLink' }));
  });

  it('returns undefined for a node outside every known inline-link path', () => {
    const node = { _type: 'link', href: 'https://example.com' };

    const result = objectHandler(node, [
      'body',
      { _key: 'block1' },
      'markDefs',
      { _key: 'mark1' },
    ]);

    expect(result).toBeUndefined();
  });

  it('is scoped to exactly the document types the real schema graph embeds inlineLink in', () => {
    const embedding = typesEmbedding(inlineLinkSchema.name);

    const derivedDocumentTypes = (schemaTypes as TTypeNode[])
      .filter(
        (schemaType) =>
          schemaType.type === 'document' &&
          schemaType.name !== undefined &&
          embedding.has(schemaType.name),
      )
      .map((schemaType) => schemaType.name as string)
      .sort();

    expect([...migration.documentTypes].sort()).toEqual(derivedDocumentTypes);
  });
});
