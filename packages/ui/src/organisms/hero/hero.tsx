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
  titleId: string;
  eyebrow?: string;
  excerpt?: string;
  tags?: string[];
  publishedAt?: string;
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
          <div className={s.copy()}>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
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
            {tags && tags.length > 0 && (
              <div className={s.tags()}>
                {tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            )}
          </div>
          {slots.Media}
        </div>

        {slots.Cta}
        {unmatched.map((node, i) => (
          <Fragment key={i}>{node}</Fragment>
        ))}
      </div>
    </section>
  );
};

export const Hero: TCompoundComponent<typeof HeroRoot, typeof HeroParts> =
  Object.assign(HeroRoot, HeroParts);
