import { at, setIfMissing, type NodePatch } from 'sanity/migrate';

export type THeadingBlockSourceDoc = {
  heading?: string;
  supportingText?: string;
  headingBlock?: unknown;
};

export const backfillHeadingBlock = (
  doc: THeadingBlockSourceDoc,
): NodePatch[] | undefined => {
  if (doc.headingBlock !== undefined) return undefined;
  if (doc.heading === undefined && doc.supportingText === undefined) {
    return undefined;
  }

  return [
    at(
      'headingBlock',
      setIfMissing({
        heading: doc.heading,
        supportingText: doc.supportingText,
      }),
    ),
  ];
};
