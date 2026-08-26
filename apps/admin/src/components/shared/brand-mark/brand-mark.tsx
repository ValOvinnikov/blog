import { brandMarkVariants } from './brand-mark-variants';

export type TBrandMarkProps = {
  /** Accessible name for standalone use; omit to keep the mark decorative. */
  title?: string;
  className?: string;
};

export const BrandMark = ({ title, className }: TBrandMarkProps) => (
  <div
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
    className={brandMarkVariants({ class: className })}
  >
    V
  </div>
);
