import type { IWithDataTestId } from '@blog/config';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import { Heading } from '@blog/ui/atoms/heading';
import { Tag } from '@blog/ui/atoms/tag';
import { Text } from '@blog/ui/atoms/text';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  Fragment,
} from 'react';

import { HeroCta } from './components/cta/hero-cta';
import { HeroMedia } from './components/media/hero-media';
import { heroVariants } from './hero-variants';

const HeroParts = {
  Media: HeroMedia,
  Cta: HeroCta,
} satisfies Record<string, ElementType>;

export interface IHeroProps
  extends
    Omit<ComponentPropsWithoutRef<'section'>, 'children'>,
    IWithDataTestId {
  title: string;
  titleId: string;
  eyebrow?: string;
  excerpt?: string;
  /**
   * Post tags, rendered as a `Tag` list beneath the excerpt. The Home hero
   * doesn't pass this — it's a reuse slot for post-style hero contexts
   * (e.g. a Post Detail hero) that want tags surfaced in the hero itself.
   * Intentionally optional, not dead code.
   */
  tags?: string[];
  /**
   * ISO 8601 publish date, rendered as the `<time dateTime>` meta line
   * alongside `formattedDate` (both must be present for the line to
   * render). The Home hero doesn't pass this — it's a reuse slot for
   * post-style hero contexts. Intentionally optional, not dead code.
   */
  publishedAt?: string;
  /**
   * Pre-formatted display string for `publishedAt` — `@blog/ui` never
   * formats dates itself, the caller supplies the formatted text. See
   * `publishedAt`.
   */
  formattedDate?: string;
  children?: TCompoundChildren<typeof HeroParts>;
}

const HeroRoot = ({
  title,
  titleId,
  eyebrow,
  excerpt,
  tags,
  publishedAt,
  formattedDate,
  children,
  className,
  dataTestId,
  ...rest
}: IHeroProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, HeroParts);
  const s = heroVariants({ hasMedia: Boolean(slots.Media) });

  return (
    <section
      aria-labelledby={titleId}
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      <div className={s.content()}>
        <div className={s.grid()}>
          <div className={s.copy()} data-testid="hero-copy">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {/*
              Meta (date) slot: not used by the Home hero — reserved for
              post-style hero reuse (see `publishedAt`/`formattedDate` JSDoc
              on `IHeroProps`).
            */}
            {publishedAt && formattedDate && (
              <time dateTime={publishedAt} className={s.meta()}>
                {formattedDate}
              </time>
            )}
            <div className={s.title()}>
              <Heading id={titleId} level={1} visual="hero">
                {title}
              </Heading>
            </div>
            {excerpt && (
              <Text variant="hero" className={s.excerpt()}>
                {excerpt}
              </Text>
            )}
            {/*
              Tags slot: not used by the Home hero — reserved for
              post-style hero reuse (see `tags` JSDoc on `IHeroProps`).
            */}
            {tags && tags.length > 0 && (
              <div className={s.tags()}>
                {tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            )}
            {slots.Cta}
          </div>
          {slots.Media}
        </div>

        {unmatched.map((node, i) => (
          <Fragment key={i}>{node}</Fragment>
        ))}
      </div>
    </section>
  );
};

export const Hero: TCompoundComponent<typeof HeroRoot, typeof HeroParts> =
  Object.assign(HeroRoot, HeroParts);
