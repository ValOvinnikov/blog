import { SANITY_WEBHOOK_OPERATION, type TMaybeNull } from '@shinefold/config';
import { isString } from '@shinefold/utils/primitives';
import type { IRevalidateWebhookRedirect } from '@web/server/revalidate/is-revalidate-webhook-body/is-revalidate-webhook-body';
import type { TLocalizedPath } from '@web/utils/build-next-page-paths';

const buildCurrentLanguagePaths = (
  operation: TMaybeNull<string>,
  { source, previousSource, language }: IRevalidateWebhookRedirect,
): TLocalizedPath[] => {
  if (!language) {
    return [];
  }
  const sources =
    operation === SANITY_WEBHOOK_OPERATION.DELETE
      ? [previousSource ?? source]
      : [source, previousSource];
  return sources.filter(isString).map((path) => ({ language, path }));
};

const buildPreviousLanguagePaths = ({
  source,
  previousSource,
  language,
  previousLanguage,
}: IRevalidateWebhookRedirect): TLocalizedPath[] => {
  const path = previousSource ?? source;
  return previousLanguage && previousLanguage !== language && isString(path)
    ? [{ language: previousLanguage, path }]
    : [];
};

export const buildRedirectPaths = (
  operation: TMaybeNull<string>,
  redirect: IRevalidateWebhookRedirect,
): TLocalizedPath[] => [
  ...buildCurrentLanguagePaths(operation, redirect),
  ...buildPreviousLanguagePaths(redirect),
];
