import { schemaTypes } from '@blog/studio/schema-types';
import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';

import migration from './index';

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

const collectAnnotationRefs = (schemaType: TTypeNode): Set<string> => {
  const refs = new Set<string>();

  const visit = (node: TTypeNode | undefined, viaAnnotation: boolean): void => {
    if (!node) return;
    if (typeof node.type === 'string' && viaAnnotation) refs.add(node.type);
    node.fields?.forEach((child) => visit(child, viaAnnotation));
    node.of?.forEach((child) => visit(child, viaAnnotation));
    node.marks?.annotations?.forEach((child) => visit(child, true));
  };

  schemaType.fields?.forEach((node) => visit(node, false));
  schemaType.of?.forEach((node) => visit(node, false));
  schemaType.marks?.annotations?.forEach((node) => visit(node, true));

  return refs;
};

/**
 * Every registered schema type reachable from a `marks.annotations`
 * declaration of `targetName`, directly or transitively.
 * An array `of:` membership or a plain field does not seed the set by
 * itself — only an annotation edge does, though ordinary field/array
 * composition still propagates the set upward once seeded.
 */
const typesEmbedding = (targetName: string): Set<string> => {
  const embedding = new Set<string>();

  for (const schemaType of schemaTypes as TTypeNode[]) {
    const name = schemaType.name;

    if (name && collectAnnotationRefs(schemaType).has(targetName)) {
      embedding.add(name);
    }
  }

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

describe('migrate-portable-text-links-to-link-references documentTypes coverage', () => {
  it('covers every document type the real schema graph currently embeds linkRef in', () => {
    const embedding = typesEmbedding(linkRefSchema.name);

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
