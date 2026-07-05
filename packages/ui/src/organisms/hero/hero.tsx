import type { IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { Fragment } from 'react';

import { Button } from '../../atoms/button';
import { Heading } from '../../atoms/heading';
import { Tag } from '../../atoms/tag';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '../../lib/compound';
import { heroVariants } from './hero-variants';

const s = heroVariants();

export const HeroMedia = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'>) => (
  <div className={s.image({ class: className })} {...rest} />
);

type THeroCtaOwnProps = {
  className?: string;
  children?: ReactNode;
};

export const HeroCta = <C extends ElementType = 'a'>({
  as,
  className,
  children,
  ...rest
}: TPolymorphicProps<C, THeroCtaOwnProps>) => {
  const Component = (as ?? 'a') as ElementType;
  return (
    <Component className={s.cta({ class: className })} {...rest}>
      <Button>{children}</Button>
    </Component>
  );
};

const HeroParts = {
  Media: HeroMedia,
  Cta: HeroCta,
} satisfies Record<string, ElementType>;

export interface IHeroProps
  extends
    Omit<ComponentPropsWithoutRef<'section'>, 'children'>,
    IWithDataTestId {
  title: string;
  excerpt?: string;
  tags?: string[];
  publishedAt?: string;
  children?: TCompoundChildren<typeof HeroParts>;
}

const HeroRoot = ({
  title,
  excerpt,
  tags,
  publishedAt,
  children,
  className,
  dataTestId,
  ...rest
}: IHeroProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, HeroParts);
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : undefined;

  return (
    <section
      aria-label="Featured post"
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {slots.Media}
      <div className={s.content()}>
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
    </section>
  );
};

export const Hero: TCompoundComponent<typeof HeroRoot, typeof HeroParts> =
  Object.assign(HeroRoot, HeroParts);
