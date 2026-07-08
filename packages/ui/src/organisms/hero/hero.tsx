import type { IWithDataTestId } from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';
import { Tag } from '@blog/ui/atoms/tag';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/compound';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { Fragment } from 'react';

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
  eyebrow?: string;
  excerpt?: string;
  tags?: string[];
  publishedAt?: string;
  formattedDate?: string;
  children?: TCompoundChildren<typeof HeroParts>;
  ariaLabel?: string;
}

const HeroRoot = ({
  title,
  eyebrow,
  excerpt,
  tags,
  publishedAt,
  formattedDate,
  children,
  className,
  dataTestId,
  ariaLabel,
  ...rest
}: IHeroProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, HeroParts);
  const s = heroVariants({ hasMedia: Boolean(slots.Media) });

  return (
    <section
      aria-label={ariaLabel}
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      <div className={s.content()}>
        {eyebrow && <p className={s.eyebrow()}>{eyebrow}</p>}
        {publishedAt && formattedDate && (
          <time dateTime={publishedAt} className={s.meta()}>
            {formattedDate}
          </time>
        )}
        <div className={s.title()}>
          <Heading level={1}>{title}</Heading>
        </div>
        {excerpt && <p className={s.excerpt()}>{excerpt}</p>}
        {tags && tags.length > 0 && (
          <div className={s.tags()}>
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
        {slots.Cta}
        {unmatched.map((node, i) => (
          <Fragment key={i}>{node}</Fragment>
        ))}
      </div>
      {slots.Media}
    </section>
  );
};

export const Hero: TCompoundComponent<typeof HeroRoot, typeof HeroParts> =
  Object.assign(HeroRoot, HeroParts);
