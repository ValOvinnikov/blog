import { routes } from '@shinefold/config';
import { BookmarkButtonGate } from '@web/components/features/post/bookmark-button-gate';
import { PostShareLinks } from '@web/components/shared/post-share-links';
import { routing } from '@web/i18n/routing';
import { getRequestContext } from '@web/server/request-context/request-context';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
import { getTranslations } from 'next-intl/server';

import { PostSummaryButton } from './components/post-summary-button/post-summary-button';
import { postArticleActionsVariants } from './post-article-actions-variants';

export interface IPostArticleActionsProps {
  postId: string;
  slug: string;
  title: string;
  hasSummary: boolean;
}

const s = postArticleActionsVariants();

export const PostArticleActions = async ({
  postId,
  slug,
  title,
  hasSummary,
}: IPostArticleActionsProps) => {
  const [t, { metadataBase, locale, defaultLocale = routing.defaultLocale }] =
    await Promise.all([
      getTranslations('blogPostPage.postSummary'),
      getRequestContext(),
    ]);
  const path = toLocalizedPathname({
    href: routes.post(slug),
    locale,
    defaultLocale,
  });
  const url = metadataBase ? new URL(path, metadataBase).href : path;

  return (
    <div className={s.root()}>
      <BookmarkButtonGate postId={postId} />
      <PostShareLinks url={url} title={title} />
      {hasSummary && <PostSummaryButton label={t('button')} />}
    </div>
  );
};
