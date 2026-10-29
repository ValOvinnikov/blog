import type { IWithClassName } from '@blog/config/types';

import {
  brandMarkVariants,
  type TBrandMarkVariants,
} from './brand-mark-variants';

export type TBrandMarkProps = IWithClassName & {
  title?: string;
  size?: TBrandMarkVariants['size'];
};

export const BrandMark = ({ title, size, className }: TBrandMarkProps) => (
  <div
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
    className={brandMarkVariants({ size, class: className })}
  >
    V
  </div>
);
