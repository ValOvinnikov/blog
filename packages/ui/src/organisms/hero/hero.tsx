import type { IWithDataTestId } from '@blog/config';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import { Heading } from '@blog/ui/atoms/heading';
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
  children?: TCompoundChildren<typeof HeroParts>;
}

/**
 * Hero — the page-top hero band: renders `title` as an `<h1>` with optional
 * `eyebrow` and `excerpt`, plus `Hero.Cta` and `Hero.Media` slots. Switches to
 * a two-column layout when a `Hero.Media` slot is present.
 */
const HeroRoot = ({
  title,
  titleId,
  eyebrow,
  excerpt,
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
