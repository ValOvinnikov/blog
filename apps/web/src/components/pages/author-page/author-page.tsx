import { service } from '@blog/service';
import { ActionList, AuthorByline, Eyebrow, ShareLink } from '@blog/ui';
import { SmartLink } from '@web/components/shared/smart-link';
import { blockTextToPlain } from '@web/utils/block-text-to-plain';
import { notFound } from 'next/navigation';

import { authorPageVariants } from './author-page-variants';

type TAuthorPageProps = { slug: string };

const s = authorPageVariants();

/**
 * AuthorPage — `/author/[slug]` composition: fetches the author via
 * `service.entities.author.v1.getAuthor`, then renders their profile
 * (role, name/bio/avatar via `AuthorByline`, and social links via
 * `ShareLink`/`ActionList`). Scoped to profile only — the author's post list
 * is a separate tracked follow-up (#593/#594/#595).
 */
export async function AuthorPage({ slug }: TAuthorPageProps) {
  const author = await service.entities.author.v1.getAuthor(slug);

  if (!author) {
    notFound();
  }

  return (
    <main className={s.root()}>
      {author.role && <Eyebrow className={s.eyebrow()}>{author.role}</Eyebrow>}

      <AuthorByline
        className={s.byline()}
        name={author.name}
        bio={blockTextToPlain(author.bio)}
        avatarUrl={author.imageUrl}
      />

      {author.socialLinks.length > 0 && (
        <ActionList className={s.socialLinks()}>
          {author.socialLinks.map((link) => (
            <ShareLink
              key={link.url}
              href={link.url}
              label={link.platform}
              as={SmartLink}
            />
          ))}
        </ActionList>
      )}
    </main>
  );
}
