import type { IWithDataTestId } from '@blog/config';
import { MediaFrame } from '@blog/ui/atoms/media-frame';
import type { ComponentPropsWithoutRef } from 'react';

import { heroMediaVariants } from './hero-media-variants';

interface IHeroMediaProps
  extends ComponentPropsWithoutRef<'div'>, IWithDataTestId {}

/**
 * HeroMedia — the media slot of a `Hero`; frames its content at a 16:9 ratio via
 * `MediaFrame`.
 */
export const HeroMedia = ({
  className,
  dataTestId,
  ...rest
}: IHeroMediaProps) => (
  <MediaFrame
    ratio="video"
    className={heroMediaVariants({ class: className })}
    dataTestId={dataTestId}
    {...rest}
  />
);
