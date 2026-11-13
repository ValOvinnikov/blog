import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { toInitial } from '@blog/utils/primitives';

import {
  brandMarkImageVariants,
  brandMarkVariants,
  type TBrandMarkVariants,
} from './brand-mark-variants';

export type TBrandMarkProps = IWithClassName &
  IWithDataTestId & {
    size?: TBrandMarkVariants['size'];
    title?: string;
    src?: string;
    siteName?: string;
    isStacked?: boolean;
  };

/** The site's logo: its uploaded image, or a tile holding the initial of the site's name when it has none. */
export const BrandMark = ({
  src,
  size,
  isStacked,
  title,
  siteName = '',
  className,
  dataTestId,
}: TBrandMarkProps) => {
  if (src) {
    return (
      <img
        src={src}
        alt={title ?? ''}
        className={brandMarkImageVariants({
          size,
          stacked: isStacked,
          class: className,
        })}
        data-testid={dataTestId}
      />
    );
  }

  return (
    <span
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={brandMarkVariants({ size, class: className })}
      data-testid={dataTestId}
    >
      {toInitial(siteName)}
    </span>
  );
};
