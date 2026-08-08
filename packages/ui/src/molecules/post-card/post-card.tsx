import { ICONS, Size, type IWithDataTestId } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { Tag } from '@blog/ui/atoms/tag';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { CardMeta } from '@blog/ui/molecules/card-meta';
import {
  cloneElement,
  type ComponentPropsWithoutRef,
  type ElementType,
  Fragment,
  type ReactElement,
} from 'react';

import {
  type IPostCardFooterProps,
  PostCardFooter,
} from './components/footer/post-card-footer';
import { PostCardMedia } from './components/media/post-card-media';
import { PostCardTitle } from './components/title/post-card-title';
import { postCardVariants } from './post-card-variants';

const s = postCardVariants();

const PostCardParts = {
  Media: PostCardMedia,
  Meta: CardMeta,
  Title: PostCardTitle,
  Footer: PostCardFooter,
} satisfies Record<string, ElementType>;

export interface IPostCardProps
  extends
    Omit<ComponentPropsWithoutRef<'article'>, 'children'>,
    IWithDataTestId {
  excerpt?: string;
  tags?: string[];
  children?: TCompoundChildren<typeof PostCardParts>;
}

/**
 * PostCard — the article summary card used in listings; composes
 * `PostCard.Media`, `PostCard.Meta`, `PostCard.Title`, and `PostCard.Footer`
 * slots around an optional `excerpt` and `tags` row, rendered as an `<article>`.
 */
const PostCardRoot = ({
  excerpt,
  tags,
  children,
  className,
  dataTestId,
  ...rest
}: IPostCardProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, PostCardParts);
  const footer = slots.Footer as ReactElement<IPostCardFooterProps> | undefined;
  const footerSlot = footer
    ? cloneElement(footer, {
        trailingIcon: footer.props.trailingIcon ?? (
          <Icon
            name={ICONS.ARROW}
            size={Size.SM}
            dataTestId="post-card-footer-arrow"
          />
        ),
      })
    : undefined;

  return (
    <article
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {slots.Media}
      <div className={s.content()}>
        {slots.Meta}
        {slots.Title}
        {unmatched.map((node, i) => (
          <Fragment key={i}>{node}</Fragment>
        ))}
        {tags && tags.length > 0 && (
          <div className={s.tags()}>
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
        {excerpt && <p className={s.excerpt()}>{excerpt}</p>}
        {footerSlot}
      </div>
    </article>
  );
};

export const PostCard: TCompoundComponent<
  typeof PostCardRoot,
  typeof PostCardParts
> = Object.assign(PostCardRoot, PostCardParts);
