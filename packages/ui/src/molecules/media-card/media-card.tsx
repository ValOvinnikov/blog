import { type IWithClassName, type IWithDataTestId } from '@blog/config';
import { Tag } from '@blog/ui/atoms/tag';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { CardMeta } from '@blog/ui/molecules/card-meta';
import { cloneElement, Fragment, type ElementType } from 'react';

import { MediaCardFooter } from './components/footer/media-card-footer';
import { MediaCardMedia } from './components/media/media-card-media';
import { MediaCardTitle } from './components/title/media-card-title';
import {
  mediaCardVariants,
  type TMediaCardVariants,
} from './media-card-variants';

const MediaCardParts = {
  Media: MediaCardMedia,
  Meta: CardMeta,
  Title: MediaCardTitle,
  Footer: MediaCardFooter,
} satisfies Record<string, ElementType>;

export type TMediaCardProps = IWithClassName &
  IWithDataTestId & {
    excerpt?: string;
    tags?: string[];
    isSplit?: TMediaCardVariants['isSplit'];
    isLead?: TMediaCardVariants['isLead'];
    align?: TMediaCardVariants['align'];
    isInteractive?: TMediaCardVariants['isInteractive'];
    children?: TCompoundChildren<typeof MediaCardParts>;
  };

/** A media-led summary card for any linked item, rendered as an `<article>`. */
const MediaCardRoot = ({
  excerpt,
  tags,
  isSplit,
  isLead,
  align,
  isInteractive,
  children,
  className,
  dataTestId,
}: TMediaCardProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, MediaCardParts);
  const hasMedia = Boolean(slots.Media);
  const isSplitLayout = Boolean(isSplit) && hasMedia;
  const s = mediaCardVariants({
    isSplit: isSplitLayout,
    isLead,
    align,
    isInteractive,
  });

  const media =
    slots.Media && (isLead || align === 'center')
      ? cloneElement(slots.Media, {
          ...(isLead ? { isLead: true } : {}),
          ...(align === 'center' ? { align } : {}),
        })
      : slots.Media;

  return (
    <article className={s.root({ class: className })} data-testid={dataTestId}>
      {isSplitLayout ? <div className={s.media()}>{media}</div> : media}
      <div className={s.content()} data-testid="media-card-content">
        {slots.Meta}
        {isLead && slots.Title
          ? cloneElement(slots.Title, { isLead: true })
          : slots.Title}
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
        {slots.Footer}
      </div>
    </article>
  );
};

export const MediaCard: TCompoundComponent<
  typeof MediaCardRoot,
  typeof MediaCardParts
> = Object.assign(MediaCardRoot, MediaCardParts);
