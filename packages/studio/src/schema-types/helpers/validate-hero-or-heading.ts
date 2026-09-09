import type { DocumentRule, SanityDocument } from 'sanity';

type THeroOrHeadingDocument = {
  hero?: { _ref?: string };
  sectionHeader?: { heading?: string };
};

type THasEntityTitle = (document: SanityDocument | undefined) => boolean;

const asHeroOrHeadingDocument = (
  document: SanityDocument | undefined,
): THeroOrHeadingDocument | undefined =>
  document as THeroOrHeadingDocument | undefined;

const hasHero = (document: SanityDocument | undefined): boolean =>
  Boolean(asHeroOrHeadingDocument(document)?.hero?._ref);

const hasHeading = (
  document: SanityDocument | undefined,
  hasEntityTitle: THasEntityTitle,
): boolean =>
  Boolean(asHeroOrHeadingDocument(document)?.sectionHeader?.heading) ||
  hasEntityTitle(document);

const validateRequired =
  (hasEntityTitle: THasEntityTitle) =>
  (document: SanityDocument | undefined): string | true =>
    hasHero(document) || hasHeading(document, hasEntityTitle)
      ? true
      : 'Add a hero or a heading';

const validateNotBoth =
  (hasEntityTitle: THasEntityTitle) =>
  (document: SanityDocument | undefined): string | true =>
    hasHero(document) && hasHeading(document, hasEntityTitle)
      ? 'The hero hides the heading'
      : true;

/**
 * Document-level rule for a page whose heading can come from `hero` or
 * `sectionHeader.heading` — pass `hasEntityTitle` when the page can also
 * derive its heading from a referenced entity (e.g. a topic page's topic).
 */
export const validateHeroOrHeading =
  (options: { hasEntityTitle?: THasEntityTitle } = {}) =>
  (rule: DocumentRule): DocumentRule[] => {
    const hasEntityTitle = options.hasEntityTitle ?? (() => false);

    return [
      rule.custom(validateRequired(hasEntityTitle)),
      rule.custom(validateNotBoth(hasEntityTitle)).warning(),
    ];
  };
