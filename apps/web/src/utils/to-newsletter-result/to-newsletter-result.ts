import {
  NEWSLETTER_RESULT,
  NEWSLETTER_RESULT_SLUGS,
  type TMaybeUndefined,
  type TNewsletterResult,
} from '@blog/config';

export const toNewsletterResult = (
  slug: string,
): TMaybeUndefined<TNewsletterResult> =>
  Object.values(NEWSLETTER_RESULT).find(
    (result) => NEWSLETTER_RESULT_SLUGS[result] === slug,
  );
