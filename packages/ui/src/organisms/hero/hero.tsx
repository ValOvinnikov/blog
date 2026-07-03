import type { IWithDataTestId } from '@blog/config';
import type { HTMLAttributes } from 'react';

import { Button } from '../../atoms/button';
import { Heading } from '../../atoms/heading';
import { Tag } from '../../atoms/tag';
import { heroVariants } from './hero-variants';

export interface IHeroProps
  extends HTMLAttributes<HTMLElement>, IWithDataTestId {
  title: string;
  excerpt?: string;
  href: string;
  ctaLabel?: string;
  tags?: string[];
  coverImage?: { src: string; alt: string };
  publishedAt?: string;
}

export function Hero({
  title,
  excerpt,
  href,
  ctaLabel = 'Read more',
  tags,
  coverImage,
  publishedAt,
  className,
  dataTestId,
  ...rest
}: IHeroProps) {
  const {
    root,
    image: imageSlot,
    content: contentSlot,
    meta: metaSlot,
    title: titleSlot,
    excerpt: excerptSlot,
    tags: tagsSlot,
    cta: ctaSlot,
  } = heroVariants();

  return (
    <section
      aria-label="Featured post"
      className={root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {coverImage && (
        <img
          className={imageSlot()}
          src={coverImage.src}
          alt={coverImage.alt}
        />
      )}

      <div className={contentSlot()}>
        {publishedAt && (
          <time dateTime={publishedAt} className={metaSlot()}>
            {new Date(publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        )}

        <div className={titleSlot()}>
          <Heading level={1}>{title}</Heading>
        </div>

        {excerpt && <p className={excerptSlot()}>{excerpt}</p>}

        {tags && tags.length > 0 && (
          <div className={tagsSlot()}>
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}

        <div className={ctaSlot()}>
          <a href={href}>
            <Button>{ctaLabel}</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
