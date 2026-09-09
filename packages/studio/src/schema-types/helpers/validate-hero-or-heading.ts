import type { DocumentRule, SanityDocument } from 'sanity';

type THeroOrHeadingDocument = {
  hero?: { _ref?: string };
  sectionHeader?: { heading?: string };
};

const asHeroOrHeadingDocument = (
  document: SanityDocument | undefined,
): THeroOrHeadingDocument | undefined =>
  document as THeroOrHeadingDocument | undefined;

const hasHero = (document: SanityDocument | undefined): boolean =>
  Boolean(asHeroOrHeadingDocument(document)?.hero?._ref);

const hasHeading = (document: SanityDocument | undefined): boolean =>
  Boolean(asHeroOrHeadingDocument(document)?.sectionHeader?.heading);

const validateRequired = (
  document: SanityDocument | undefined,
): string | true =>
  hasHero(document) || hasHeading(document) ? true : 'Add a hero or a heading';

const validateNotBoth = (
  document: SanityDocument | undefined,
): string | true =>
  hasHero(document) && hasHeading(document)
    ? 'The hero hides the heading'
    : true;

/**
 * Document-level rule requiring at least one of `hero` or
 * `sectionHeader.heading`, and warning (not erroring) when both are set.
 */
export const validateHeroOrHeading =
  () =>
  (rule: DocumentRule): DocumentRule[] => [
    rule.custom(validateRequired),
    rule.custom(validateNotBoth).warning(),
  ];
